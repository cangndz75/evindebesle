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
type Body = {
  draftAppointmentId: string;
  amount: number; // kuruş veya TL
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
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const input: Body = await req.json();
    if (!input?.draftAppointmentId || !input?.amount || !input?.card?.number) {
      return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 });
    }

    // amount: kuruş geldiyse TL’ye çevir
    const amountTL =
      input.amount >= 1000 ? Number((input.amount / 100).toFixed(2)) : Number(input.amount);

    const ps = await prisma.paymentSession.create({
      data: {
        userId: session.user.id,
        draftId: input.draftAppointmentId,
        amount: Math.round(amountTL * 100), // kuruş sakla
        currency: input.currency || "TRY",
        status: PaymentSessionStatus.INIT,
      },
    });

    const orderId = ps.id;
    const correlationId = newCorrelationId();
    const callbackUrl = `${TAMI.APP_BASE_URL}/api/payment/3ds-return?sid=${ps.id}`;

    const fullName = String(input?.buyer?.name || session.user.name || "Musteri").trim();
    const [first, ...rest] = fullName.split(/\s+/);
    const name = first || "Musteri";
    const surName = (input?.buyer?.surName || rest.join(" ") || "Soyisim").trim();

    const tamiBodyBase: any = {
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
      buyer: input.buyer ?? {
        ipAddress: getClientIp(req),
        name,
        surName,
        emailAddress: session.user.email || "noreply@example.com",
        buyerId: session.user.id,
        phoneNumber: "5555555555",
      },
      billingAddress: input.billingAddress ?? {
        address: "N/A",
        city: "İstanbul",
        country: "Türkiye",
        contactName: `${name} ${surName}`,
      },
      shippingAddress: input.shippingAddress ?? {
        address: "N/A",
        city: "İstanbul",
        country: "Türkiye",
        contactName: `${name} ${surName}`,
      },
      basket: input.basket ?? {
        basketId: orderId,
        basketItems: [
          {
            itemId: "service",
            name: "Evde Hizmet",
            itemType: "VIRTUAL",
            numberOfProducts: 1,
            unitPrice: amountTL,
            totalPrice: amountTL,
          },
        ],
      },
    };

    // ✅ SecurityHash ekle
    const securityHash = await generateSecurityHashV2(tamiBodyBase);
    const tamiBody = { ...tamiBodyBase, securityHash };

    console.log("[TAMI AUTH][REQUEST_BODY]", tamiBody);

    const res = await fetch(`${TAMI.BASE_URL}/payment/auth`, {
      method: "POST",
      headers: tamiHeaders(correlationId),
      body: JSON.stringify(tamiBody),
    });

    // 🔴 tüm request ve response loglansın
    console.log("[TAMI AUTH][REQUEST_URL]", `${TAMI.BASE_URL}/payment/auth`);
    console.log("[TAMI AUTH][HEADERS]", tamiHeaders(correlationId));
    console.log("[TAMI AUTH][REQUEST_BODY]", JSON.stringify(tamiBody, null, 2));

    let data: any = {};
    try {
      data = await res.json();
    } catch (err) {
      console.error("[TAMI AUTH][JSON_PARSE_ERR]", err);
    }

    console.log("[TAMI AUTH][RESPONSE_STATUS]", res.status);
    console.log("[TAMI AUTH][RESPONSE_BODY]", data);


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
