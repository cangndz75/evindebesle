
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { finalizePayment } from "@/lib/services/payment";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const paymentId = formData.get("paymentId")?.toString();
  const conversationData = formData.get("conversationData")?.toString();
  const conversationId = formData.get("conversationId")?.toString();

  if (!paymentId || !conversationId) {
    return new Response("Eksik parametre", { status: 400 });
  }

  try {
    const { data } = await axios.post(
      "https://sandbox-api.iyzipay.com/payment/3dsecure/auth",
      {
        locale: "tr",
        conversationId,
        paymentId,
        conversationData,
      },
      {
        auth: {
          username: process.env.IYZICO_API_KEY!,
          password: process.env.IYZICO_SECRET_KEY!,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (data.status !== "success") {
      console.error("3D Secure Auth BaÅŸarÄ±sÄ±z:", data);
      return NextResponse.redirect(`${process.env.APP_URL}/payment/result?status=failure&uid=${conversationId}`);
    }

    const paidPrice = parseFloat(data.paidPrice);

    const orderId = conversationId;

    await finalizePayment({
      orderId,
      paymentId,
      conversationId,
      rawResult: data
    });

    return NextResponse.redirect(`${process.env.APP_URL}/payment/result?status=success&uid=${orderId}`);

  } catch (error: any) {
    console.error("3D Secure Confirm Error:", error.response?.data || error.message);
    return NextResponse.redirect(`${process.env.APP_URL}/payment/result?status=error&uid=${conversationId}`);
  }
}
