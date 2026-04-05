import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { PaymentSessionStatus } from "@prisma/client";
import { TAMI, tamiHeaders, newCorrelationId } from "@/lib/tami/config";
import { generateSecurityHashV2 } from "@/lib/tami/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Card = { number: string; name: string; expireMonth: string; expireYear: string; cvc: string };

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const input = await req.json();
    if (!input?.draftAppointmentId || !input?.amount || !input?.card?.number) {
      return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
    }

    const amountTL = Number((input.amount / 100).toFixed(2));

    const ps = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        draftId: input.draftAppointmentId,
        amount: input.amount,
        currency: input.currency || "TRY",
        status: PaymentSessionStatus.INIT,
      },
    });

    const orderId = ps.id;
    const correlationId = newCorrelationId();
    const callbackUrl = `${TAMI.APP_BASE_URL}/api/payment/3ds-return?sid=${ps.id}`;

    const tamiBodyBase = {
      amount: amountTL,
      orderId,
      currency: input.currency || "TRY",
      installmentCount: 1,
      paymentGroup: "PRODUCT",
      paymentChannel: "WEB",
      callbackUrl,
      card: {
        holderName: input.card.name,
        cvv: String(input.card.cvc || "").trim(),
        expireMonth: Number(input.card.expireMonth),
        expireYear: Number(input.card.expireYear),
        number: String(input.card.number || "").replace(/\s+/g, ""),
      },
      buyer: {
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        name: session.user.name || "MÃ¼ÅŸteri",
        surName: session.user.name?.split(" ").slice(-1)[0] || "Soyisim",
        emailAddress: session.user.email || "noreply@example.com",
        buyerId: session.user.id,
        phoneNumber: "5555555555",
      },
    };

    const securityHash = await generateSecurityHashV2(tamiBodyBase);
    const tamiBody = { ...tamiBodyBase, securityHash };

    const headers = Object.fromEntries(tamiHeaders(correlationId));
    const res = await fetch(`${TAMI.BASE_URL}/payment/auth`, {
      method: "POST",
      headers,
      body: JSON.stringify(tamiBody),
    });
    const data = await res.json().catch(() => ({}));
    console.log("[TAMI AUTH] response status", res.status, "for order", orderId);

    if (!res.ok || data?.success === false || !data?.threeDSHtmlContent) {
      await prisma.paymentSession.update({
        where: { id: ps.id },
        data: {
          status: PaymentSessionStatus.FAILED,
          error: data?.errorMessage || JSON.stringify(data || {}),
          correlationId,
          orderId,
        },
      });
      return NextResponse.json({ error: "TAMI_AUTH_FAILED" }, { status: 400 });
    }

    const html = Buffer.from(data.threeDSHtmlContent, "base64").toString("utf8");

    await prisma.paymentSession.update({
      where: { id: ps.id },
      data: {
        orderId: data.orderId ?? orderId,
        correlationId: data.correlationId ?? correlationId,
        status: PaymentSessionStatus.AUTH_SENT,
        threeDSHtml: html,
      },
    });

    return NextResponse.json({ sessionId: ps.id, orderId });
  } catch (e: any) {
    console.error("[TAMI AUTH] exception", e);
    return NextResponse.json({ error: "AUTH_EXCEPTION" }, { status: 500 });
  }
}
