import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { TAMI, tamiHeaders } from "@/lib/tami/config";
import { securityHashForAuth } from "@/lib/tami/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1) Kullanıcı
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 401 });

    // 2) Body
    const body = await req.json();
    const {
      draftAppointmentId,
      amount,                 // kuruş (number) veya "decimal string"
      currency = "TRY",
      installmentCount = 1,
      card,
      billingAddress,
      shippingAddress,
      buyer,
      basket,
    } = body ?? {};

    if (!draftAppointmentId) {
      return NextResponse.json({ error: "MISSING_DRAFT_ID" }, { status: 400 });
    }

    // IDOR koruma
    const draft = await prisma.draftAppointment.findUnique({
      where: { id: draftAppointmentId },
      select: { userId: true },
    });
    if (!draft || draft.userId !== user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // 3) Amount → decimal
    let decimalAmount = "0.00";
    if (typeof amount === "number") decimalAmount = (amount / 100).toFixed(2);
    else if (typeof amount === "string") decimalAmount = Number(amount).toFixed(2);
    else return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });

    const inst = Number(installmentCount) || 1;

    // 4) PaymentSession
    const ps = await prisma.paymentSession.create({
      data: {
        userId: user.id,
        draftAppointmentId,
        amount: typeof amount === "number" ? amount : Math.round(Number(amount) * 100),
        currency,
        status: "AUTH_SENT",
      },
    });

    // 5) Return URL (browser dönüş)
    const callbackUrl = `${TAMI.APP_BASE_URL}/api/payment/3ds-return?sid=${ps.id}`;

    // 6) securityHash
    const securityHash = securityHashForAuth({
      orderId: ps.id,
      amountDecimal: decimalAmount,
      currency,
      installmentCount: inst,
      paymentGroup: "PRODUCT",
      paymentChannel: "WEB",
      callbackUrl,
    });

    // 7) Kart payload normalize (cvc→cvv, "04"→4)
    const cardPayload = card
      ? {
          holderName: card.name,
          cvv: String(card.cvv ?? card.cvc ?? "").trim(),
          expireMonth: Number(card.expireMonth),
          expireYear: Number(card.expireYear),
          number: String(card.number || "").replace(/\s+/g, ""),
        }
      : undefined;

    // 8) AUTH payload (merchant/terminal body’ye ekli)
    const payload: any = {
      merchantId: TAMI.MERCHANT_ID,
      terminalId: TAMI.TERMINAL_ID,
      orderId: ps.id,
      amount: Number(decimalAmount), // 16.5 vs 16.50 önemli değil
      currency,
      installmentCount: inst,        // Peşin: 1
      paymentGroup: "PRODUCT",
      paymentChannel: "WEB",
      callbackUrl,
      securityHash,
      card: cardPayload,
      billingAddress,
      shippingAddress,
      buyer: buyer ?? {
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
        buyerId: user.id,
        emailAddress: session.user.email,
      },
      basket,
    };

    // DEBUG (PAN/CVV maskele)
    const dbg = {
      ...payload,
      card: payload.card ? {
        ...payload.card,
        number: payload.card.number ? "****" + payload.card.number.slice(-4) : undefined,
        cvv: payload.card.cvv ? "***" : undefined,
      } : undefined,
      securityHash: securityHash.slice(0, 6) + "...",
    };
    console.log("[TAMI AUTH] v=", TAMI.AUTH_HASH_VERSION, " →", dbg);

    // 9) Tami AUTH
    const res = await fetch(`${TAMI.BASE_URL}/payment/auth`, {
      method: "POST",
      headers: tamiHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    console.log("[TAMI AUTH] ←", res.status, data?.errorCode || data?.errorMessage || data?.success);

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
      data: {
        orderId: data?.orderId ?? ps.id,
        correlationId: data?.correlationId ?? undefined,
        threeDSHtml: threeDSHtml ?? undefined,
      },
    });

    return NextResponse.json({ sessionId: ps.id, orderId: data?.orderId ?? ps.id });
  } catch (err: any) {
    return NextResponse.json({ error: "AUTH_EXCEPTION", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
