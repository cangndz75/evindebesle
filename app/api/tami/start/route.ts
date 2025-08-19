import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { TAMI, generateJWKSignature, tamiHeaders } from "@/lib/tami";
import { PaymentSessionStatus } from "@/lib/generated/prisma";

export const runtime = "nodejs";

type Card = { number: string; name: string; expireMonth: string; expireYear: string; cvc: string };
type Body = {
  draftAppointmentId: string;
  amount: number;
  currency?: "TRY";
  card: Card;
  buyer?: any;
  billingAddress?: any;
  shippingAddress?: any;
  basket?: any;
};

function getClientIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const input: Body = await req.json();
    if (!input?.draftAppointmentId || !input?.amount || !input?.card?.number)
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });

    const ps = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        draftAppointmentId: input.draftAppointmentId,
        amount: Math.round(Number(input.amount)),
        currency: input.currency || "TRY",
        status: PaymentSessionStatus.INIT,
      },
    });

    const orderId = ps.id;

    const tamiBody: any = {
      amount: input.amount,
      orderId,
      currency: input.currency || "TRY",
      installmentCount: 1,
      paymentGroup: "PRODUCT",
      paymentChannel: "WEB",
      callbackUrl: TAMI.callbackURL,
      card: {
        holderName: input.card.name,
        cvv: input.card.cvc,
        expireMonth: Number(input.card.expireMonth),
        expireYear: Number(input.card.expireYear),
        number: input.card.number,
      },
      buyer: input.buyer ?? {
        emailAddress: session.user.email || "noreply@example.com",
        ipAddress: getClientIp(req),
        registrationAddress: "N/A",
        buyerId: session.user.id,
        name: session.user.name || "Müşteri",
        surName: "—",
        phoneNumber: "0000000000",
      },
      billingAddress: input.billingAddress ?? {
        address: "N/A",
        city: "İstanbul",
        country: "Türkiye",
        contactName: session.user.name || "Müşteri",
      },
      shippingAddress: input.shippingAddress ?? {
        address: "N/A",
        city: "İstanbul",
        country: "Türkiye",
        contactName: session.user.name || "Müşteri",
      },
      basket: input.basket ?? {
        basketId: orderId,
        basketItems: [
          { itemId: "service", name: "Evde Hizmet", itemType: "VIRTUAL", numberOfProducts: 1, unitPrice: input.amount, totalPrice: input.amount },
        ],
      },
    };

    tamiBody.securityHash = generateJWKSignature(tamiBody);

    const res = await fetch(`${TAMI.baseURL}/payment/auth`, {
      method: "POST",
      headers: tamiHeaders(),
      body: JSON.stringify(tamiBody),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success || !data?.threeDSHtmlContent) {
      await prisma.paymentSession.update({
        where: { id: ps.id },
        data: { status: PaymentSessionStatus.FAILED, error: JSON.stringify(data || {}) },
      });
      return NextResponse.json({ error: "Tami auth hatası", details: data }, { status: 400 });
    }

    const html = Buffer.from(data.threeDSHtmlContent, "base64").toString("utf8");

    await prisma.paymentSession.update({
      where: { id: ps.id },
      data: {
        orderId: data.orderId ?? orderId,
        correlationId: data.correlationId ?? null,
        status: PaymentSessionStatus.AUTH_SENT,
        threeDSHtml: html,
      },
    });

    return NextResponse.json({ sessionId: ps.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "start3ds error" }, { status: 500 });
  }
}
