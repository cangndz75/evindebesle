import Iyzipay from "iyzipay";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

function createIyzipayClient() {
  return new Iyzipay({
    apiKey: process.env.IYZIPAY_API_KEY!,
    secretKey: process.env.IYZIPAY_SECRET_KEY!,
    uri: process.env.IYZIPAY_BASE_URL?.trim() || "https://sandbox-api.iyzipay.com",
  });
}

function formatDateForIyzico(date: Date) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      price,
      cardHolderName,
      cardNumber,
      expireMonth,
      expireYear,
      cvc,
      draftAppointmentId,
    } = await req.json();

    if (!price || !cardHolderName || !cardNumber || !expireMonth || !expireYear || !cvc) {
      return NextResponse.json({ error: "Eksik bilgi var" }, { status: 400 });
    }

    const conversationId = uuidv4();
    const totalPrice = parseFloat(price).toFixed(2);
    const now = new Date();

    const paymentRequest = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: totalPrice,
      paidPrice: totalPrice,
      currency: Iyzipay.CURRENCY.TRY,
      installments: 1,
      basketId: "BASKET-" + conversationId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/payment/callback?appointmentId=${draftAppointmentId}`,
      paymentCard: {
        cardAlias: `${cardHolderName}-${conversationId}`,
        cardHolderName,
        cardNumber: cardNumber.replace(/\s+/g, ""),
        expireMonth,
        expireYear,
        cvc,
        registerCard: 0,
      },
      buyer: {
        id: "BY-" + conversationId,
        name: cardHolderName.split(" ")[0] || "",
        surname: cardHolderName.split(" ").slice(1).join(" ") || "",
        gsmNumber: "+905350000000",
        email: "test@iyzico.com",
        identityNumber: "11111111111",
        lastLoginDate: formatDateForIyzico(now),
        registrationDate: formatDateForIyzico(now),
        registrationAddress: "Test Mah. Test Cad. No:1",
        ip: "85.34.78.112",
        city: "Istanbul",
        country: "Turkey",
        zipCode: "34732",
      },
      shippingAddress: {
        contactName: cardHolderName,
        city: "Istanbul",
        country: "Turkey",
        address: "Test Mah. Test Cad. No:1",
        zipCode: "34732",
      },
      billingAddress: {
        contactName: cardHolderName,
        city: "Istanbul",
        country: "Turkey",
        address: "Test Mah. Test Cad. No:1",
        zipCode: "34732",
      },
      basketItems: [
        {
          id: "BI-" + conversationId,
          name: "Evcil Hayvan Hizmeti",
          category1: "Hizmet",
          category2: "Bakım",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price: totalPrice,
        },
      ],
    };

    const iyzipay = createIyzipayClient();

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.threedsInitialize.create(paymentRequest, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });

    if (result.status === "success") {
      return NextResponse.json({
        message: "3D Secure başlatıldı",
        paymentPageUrl: result.paymentPageUrl,
      });
    } else {
      return NextResponse.json(
        { message: "3D Secure başlatılamadı", error: result.errorMessage },
        { status: 400 }
      );
    }
  } catch (e: any) {
    console.error("Sunucu hatası:", e);
    return NextResponse.json({ message: "Sunucu hatası", error: e.message }, { status: 500 });
  }
}
