import Iyzipay from "iyzipay";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type { PaymentRequestData } from "iyzipay";

// .env anahtarlarının doğru olduğundan emin ol
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZIPAY_API_KEY!,
  secretKey: process.env.IYZIPAY_SECRET_KEY!,
  uri: process.env.IYZIPAY_BASE_URL!,
});

export async function POST(req: NextRequest) {
  try {
    const { price, cardHolderName, cardNumber, expireMonth, expireYear, cvc } =
      await req.json();

    if (
      !price ||
      !cardHolderName ||
      !cardNumber ||
      !expireMonth ||
      !expireYear ||
      !cvc
    ) {
      return NextResponse.json({ error: "Eksik bilgi var" }, { status: 400 });
    }

    const conversationId = uuidv4();
    // Iyzipay SDK price alanlarını string ister
    const totalPrice = parseFloat(price).toFixed(2);

    const paymentRequest: PaymentRequestData = {
      locale: Iyzipay.LOCALE.TR,
      conversationId,
      price: totalPrice,
      paidPrice: totalPrice,
      currency: Iyzipay.CURRENCY.TRY,
      installments: 1,
      basketId: "B" + conversationId,
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,

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
        lastLoginDate: new Date().toISOString(),
        registrationDate: new Date().toISOString(),
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

    const result = (await new Promise<any>((resolve, reject) =>
      iyzipay.payment.create(paymentRequest, (err, res) =>
        err ? reject(err) : resolve(res)
      )
    )) as { status?: string; errorMessage?: string };

    if (result.status === "success") {
      return NextResponse.json({ message: "Ödeme başarılı", data: result });
    } else {
      return NextResponse.json(
        { message: "Ödeme reddedildi", error: result.errorMessage },
        { status: 400 }
      );
    }
  } catch (e: any) {
    console.error("Sunucu hatası:", e);
    return NextResponse.json(
      { message: "Sunucu hatası", error: e.message },
      { status: 500 }
    );
  }
}
