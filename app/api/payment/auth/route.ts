import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { PaymentSessionStatus } from "@/lib/generated/prisma";
import { TAMI, tamiHeaders, newCorrelationId } from "@/lib/tami/config";
import { generateJwkSecurityHash } from "@/lib/tami/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Card = { number: string; name: string; expireMonth: string; expireYear: string; cvc: string };
type Body = {
  draftAppointmentId: string;
  amount: number;              // TL veya kuruş gelebilir (oto normalize)
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
const normPhone = (v?: string | null) =>
  (String(v ?? "").replace(/\D/g, "").slice(-10) || "5555555555");

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

    // amount: kuruş geldiyse TL'ye çevir (165000 -> 1650)
    const amountTL =
      input.amount >= 1000 ? Number((input.amount / 100).toFixed(2)) : Number(input.amount);

    // PaymentSession (kuruş olarak sakla)
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

    // buyer zorunlu alanlar: name / surName
    const fullName = String(input?.buyer?.name || session.user.name || "Test Hesap").trim();
    const [first, ...rest] = fullName.split(/\s+/);
    const name = first || "Musteri";
    const surName = (input?.buyer?.surName || rest.join(" ") || "Soyisim").trim();

    // Body (securityHash HARİÇ)
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
        phoneNumber: normPhone((session as any)?.user?.phone),
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

    // Maskeleyip logla
    try {
      const masked = {
        ...tamiBodyBase,
        card: {
          ...tamiBodyBase.card,
          number: tamiBodyBase.card.number.replace(/\d(?=\d{4})/g, "•"),
          cvv: "***",
        },
      };
      console.log(
        "[TAMI AUTH] orderId:", orderId,
        "correlationId:", correlationId,
        "payload(base)=", JSON.stringify(masked)
      );
    } catch {}

    // JWK/HS512 → securityHash
    const securityHash = generateJwkSecurityHash(tamiBodyBase);
    const tamiBody = { ...tamiBodyBase, securityHash };

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
