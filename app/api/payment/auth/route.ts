import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { TAMI, tamiHeaders } from "@/lib/tami/config";
import { signRequestWithJWK } from "@/lib/tami/hash";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateOrderId() {
  const ts = Date.now().toString();
  const rnd = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
  return `${TAMI.MERCHANT_ID}${ts.slice(-10)}${rnd}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 401 });

    const body = await req.json();
    const {
      draftAppointmentId,
      amount,                    // kuruş (number) veya "1650.00"
      currency = "TRY",
      installmentCount = 1,
      card,
      billingAddress,
      shippingAddress,
      buyer,
      basket,
      motoInd = false,
    } = body ?? {};

    if (!draftAppointmentId) {
      return NextResponse.json({ error: "MISSING_DRAFT_ID" }, { status: 400 });
    }

    const draft = await prisma.draftAppointment.findUnique({
      where: { id: draftAppointmentId },
      select: { userId: true },
    });
    if (!draft || draft.userId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // amount → kuruş
    const amountKurus =
      typeof amount === "number" ? amount : Math.round(Number(amount) * 100);
    if (!amountKurus || isNaN(amountKurus) || amountKurus <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    // Body amount = TL number (örn. 1650)
    const amountForBody = Number((amountKurus / 100).toFixed(2));
    const inst = Number(installmentCount) || 1;

    const orderId = generateOrderId();
    const correlationId = crypto.randomUUID();

    const ps = await prisma.paymentSession.create({
      data: {
        userId: user.id,
        draftId: draftAppointmentId,
        amount: amountKurus,
        currency,
        status: "AUTH_SENT",
        orderId,
        correlationId,
      },
    });

    const callbackUrl = `${TAMI.APP_BASE_URL}/api/payment/3ds-return?sid=${ps.id}`;

    const cardPayload = card
      ? {
          holderName: card.name,
          cvv: String(card.cvv ?? card.cvc ?? "").trim(),
          expireMonth: Number(card.expireMonth),
          expireYear: Number(card.expireYear),
          number: String(card.number || "").replace(/\s+/g, ""),
        }
      : undefined;

    // ——— securityHash için JWK/HS512 ile İMZALANACAK GÖVDE ———
    const bodyWithoutHash = {
      amount: amountForBody,
      orderId,
      currency,
      installmentCount: inst,
      card: cardPayload,
      buyer: buyer ?? {
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
        buyerId: user.id,
        emailAddress: session.user.email,
      },
      billingAddress,
      shippingAddress,
      basket,
      paymentGroup: "PRODUCT",
      paymentChannel: "WEB",
      motoInd,
      callbackUrl,
    };

    const securityHash = signRequestWithJWK(bodyWithoutHash);

    const payload = { ...bodyWithoutHash, securityHash };

    console.log(
      "[TAMI AUTH] orderId:", orderId,
      "correlationId:", correlationId,
      "amount:", payload.amount,
      "installment:", inst
    );

    const res = await fetch(`${TAMI.BASE_URL}/payment/auth`, {
      method: "POST",
      headers: tamiHeaders(correlationId),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    console.log("[TAMI AUTH] status:", res.status, "resp:", data);

    if (!res.ok || data?.success === false) {
      await prisma.paymentSession.update({
        where: { id: ps.id },
        data: { status: "FAILED", error: data?.errorMessage || "AUTH_FAILED" },
      });
      return NextResponse.json({ error: "AUTH_FAILED", detail: data }, { status: 400 });
    }

    const b64 = data?.threeDSHtmlContent ?? data?.threeDSHtml ?? data?.html;
    const threeDSHtml = b64 ? Buffer.from(b64, "base64").toString("utf-8") : null;

    await prisma.paymentSession.update({
      where: { id: ps.id },
      data: { threeDSHtml: threeDSHtml ?? undefined },
    });

    return NextResponse.json({ sessionId: ps.id, orderId });
  } catch (err: any) {
    console.error("[TAMI AUTH] EX:", err);
    return NextResponse.json(
      { error: "AUTH_EXCEPTION", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
