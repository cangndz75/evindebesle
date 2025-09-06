// app/api/payment/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { PaymentSessionStatus } from "@/lib/generated/prisma";
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

    const amountTL = input.amount >= 1000 ? Number((input.amount / 100).toFixed(2)) : Number(input.amount);

    const ps = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        draftId: input.draftAppointmentId,
        amount: Math.round(amountTL * 100),
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
        name: session.user.name || "Müşteri",
        surName: "Soyisim",
        emailAddress: session.user.email || "noreply@example.com",
        buyerId: session.user.id,
        phoneNumber: "5555555555",
      },
    };

    const securityHash = await generateSecurityHashV2(tamiBodyBase);
    const tamiBody = { ...tamiBodyBase, securityHash };

    const res = await fetch(`${TAMI.BASE_URL}/payment/auth`, {
      method: "POST",
      headers: tamiHeaders(correlationId),
      body: JSON.stringify(tamiBody),
    });
    const data = await res.json().catch(() => ({}));

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
      return NextResponse.json({ error: "TAMI_AUTH_FAILED", detail: data }, { status: 400 });
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
    return NextResponse.json({ error: "AUTH_EXCEPTION", detail: String(e?.message ?? e) }, { status: 500 });
  }
}
