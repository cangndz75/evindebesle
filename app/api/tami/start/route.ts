import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { PaymentSessionStatus } from "@/lib/generated/prisma";
import { TAMI, tamiHeaders, newCorrelationId } from "@/lib/tami/config";
import { generateJwkSecurityHash } from "@/lib/tami/hash";

export const runtime = "nodejs";

type Card = { number: string; name: string; expireMonth: string; expireYear: string; cvc: string };
type Body = {
  draftAppointmentId: string;
  amount: number;              // TL cinsinden (ör: 1650)
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input: Body = await req.json();
    if (!input?.draftAppointmentId || !input?.amount || !input?.card?.number) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    // PaymentSession oluştur
    const ps = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        draftId: input.draftAppointmentId,
        amount: Math.round(Number(input.amount) * 100), // kuruş saklıyoruz
        currency: input.currency || "TRY",
        status: PaymentSessionStatus.INIT,
      },
    });

    // Tami için orderId ve correlationId
    const orderId = ps.id; // istersen burada özel bir format da üretebilirsin
    const correlationId = newCorrelationId();

    const callbackUrl = `${TAMI.APP_BASE_URL}/api/payment/3ds-return?sid=${ps.id}`;

    // Body (securityHash HARİÇ) —> JWK/HS512 ile imzalanacak
    const tamiBodyBase: any = {
      amount: Number(input.amount),        // TL sayısal
      orderId,
      currency: input.currency || "TRY",
      installmentCount: 1,
      paymentGroup: "PRODUCT",
      paymentChannel: "WEB",
      callbackUrl,

      card: {
        holderName: input.card.name,
        cvv: input.card.cvc,
        expireMonth: Number(input.card.expireMonth),
        expireYear: Number(input.card.expireYear),
        number: String(input.card.number || "").replace(/\s+/g, ""),
      },

      buyer: input.buyer ?? {
        emailAddress: session.user.email || "noreply@example.com",
        ipAddress: getClientIp(req),
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
          {
            itemId: "service",
            name: "Evde Hizmet",
            itemType: "VIRTUAL",
            numberOfProducts: 1,
            unitPrice: Number(input.amount),
            totalPrice: Number(input.amount),
          },
        ],
      },
    };

    // JWK/HS512 → securityHash
    const securityHash = generateJwkSecurityHash(tamiBodyBase);

    const tamiBody = { ...tamiBodyBase, securityHash };

    console.log("[TAMI AUTH] orderId:", orderId, "correlationId:", correlationId, "amount:", tamiBody.amount);

    const res = await fetch(`${TAMI.BASE_URL}/payment/auth`, {
      method: "POST",
      headers: tamiHeaders(correlationId),
      body: JSON.stringify(tamiBody),
    });

    const data = await res.json().catch(() => ({}));
    console.log("[TAMI AUTH] status:", res.status, "resp:", data);

    if (!res.ok || data?.success === false || !data?.threeDSHtmlContent) {
      await prisma.paymentSession.update({
        where: { id: ps.id },
        data: { status: PaymentSessionStatus.FAILED, error: data?.errorMessage || JSON.stringify(data || {}) },
      });
      return NextResponse.json({ error: "TAMI_AUTH_FAILED", detail: data }, { status: 400 });
    }

    // 3DS HTML içerik
    const html = Buffer.from(
      data?.threeDSHtmlContent ?? data?.threeDSHtml ?? data?.html,
      "base64"
    ).toString("utf8");

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
    console.error("[TAMI AUTH] EX:", e);
    return NextResponse.json(
      { error: "AUTH_EXCEPTION", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
