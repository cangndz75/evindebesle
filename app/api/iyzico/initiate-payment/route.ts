import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    cardNumber,
    cardHolderName,
    expireMonth,
    expireYear,
    cvc,
    totalPrice,
    draftAppointmentId, // ✅ bunu alıyoruz
  } = body;

  if (
    !cardNumber ||
    !cardHolderName ||
    !expireMonth ||
    !expireYear ||
    !cvc ||
    !totalPrice ||
    !draftAppointmentId
  ) {
    return NextResponse.json({ error: "Geçersiz İstek" }, { status: 400 });
  }

  try {
    const basketId = draftAppointmentId; // ✅ burası önemli
    const priceStr = Number(totalPrice).toFixed(2);

    const { data } = await axios.post(
      `${process.env.IYZICO_BASE_URL}/payment/3dsecure/initialize`,
      {
        locale: "tr",
        conversationId: Date.now().toString(),
        price: priceStr,
        paidPrice: priceStr,
        currency: "TRY",
        installment: 1,
        basketId,
        callbackUrl: `${process.env.FRONTEND_BASE_URL}/api/iyzico/confirm-payment`,
        paymentCard: {
          cardHolderName,
          cardNumber: cardNumber.replace(/\s/g, ""),
          expireMonth,
          expireYear,
          cvc,
          registerCard: 0,
        },
        buyer: {
          id: "BY123",
          name: "Test",
          surname: "Kullanıcı",
          gsmNumber: "+905350000000",
          email: "test@user.com",
          identityNumber: "11111111110",
          lastLoginDate: new Date().toISOString(),
          registrationDate: new Date().toISOString(),
          registrationAddress: "Test Mah. Deneme Cad. No:1",
          ip: "85.34.78.112",
          city: "İstanbul",
          country: "Turkey",
          zipCode: "34000",
        },
        shippingAddress: {
          contactName: "Test Kullanıcı",
          city: "İstanbul",
          country: "Turkey",
          address: "Test Mah. Deneme Cad. No:1",
          zipCode: "34000",
        },
        billingAddress: {
          contactName: "Test Kullanıcı",
          city: "İstanbul",
          country: "Turkey",
          address: "Test Mah. Deneme Cad. No:1",
          zipCode: "34000",
        },
        basketItems: [
          {
            id: basketId,
            name: "Evcil Hayvan Hizmeti",
            category1: "Pet Bakım",
            itemType: "VIRTUAL",
            price: priceStr,
          },
        ],
      },
      {
        auth: {
          username: process.env.IYZIPAY_API_KEY!,
          password: process.env.IYZIPAY_SECRET_KEY!,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Giden Ödeme İsteği:", {
      cardNumber,
      cardHolderName,
      expireMonth,
      expireYear,
      cvc,
      totalPrice,
      draftAppointmentId,
    });

    if (data.status !== "success") {
      console.error("❌ Iyzico Hatası:", data);
      return NextResponse.json({ error: data.errorMessage }, { status: 400 });
    }

    return NextResponse.json({ paymentPageUrl: data.threeDSHtmlContent });
  } catch (error: any) {
    console.error("🔥 Iyzico Exception:", error.response?.data || error.message);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
