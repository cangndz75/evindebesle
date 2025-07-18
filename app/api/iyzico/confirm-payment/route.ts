import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const paymentId = formData.get("paymentId")?.toString();
  const conversationData = formData.get("conversationData")?.toString();
  const conversationId = formData.get("conversationId")?.toString();

  if (!paymentId || !conversationData) {
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
          username: process.env.IYZIPAY_API_KEY!,
          password: process.env.IYZIPAY_SECRET_KEY!,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (data.status !== "success") {
      console.error("3D Secure Auth Başarısız:", data);
      return NextResponse.redirect(`${process.env.FRONTEND_BASE_URL}/error`);
    }

    const basketId = data.basketId;
    const paidPrice = parseFloat(data.paidPrice);

    await prisma.appointment.update({
      where: { id: basketId },
      data: {
        status: "SCHEDULED",
        paidAt: new Date(),
        finalPrice: paidPrice,
        isPaid: true,
      },
    });

    return NextResponse.redirect(`${process.env.FRONTEND_BASE_URL}/success`);
  } catch (error: any) {
    console.error("3D Secure Confirm Error:", error.response?.data || error.message);
    return NextResponse.redirect(`${process.env.FRONTEND_BASE_URL}/error`);
  }
}
