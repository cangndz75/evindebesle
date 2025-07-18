import { NextRequest, NextResponse } from "next/server";
import Iyzipay from "iyzipay";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";

function createIyzipayClient() {
  return new Iyzipay({
    apiKey: process.env.IYZIPAY_API_KEY!,
    secretKey: process.env.IYZIPAY_SECRET_KEY!,
    uri: process.env.IYZIPAY_BASE_URL?.trim() || "https://sandbox-api.iyzipay.com",
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  const formData = await req.formData();
  const token = formData.get("token")?.toString();
  const conversationId = formData.get("conversationId")?.toString();
  const appointmentId = req.nextUrl.searchParams.get("appointmentId");

  console.log("Gelen callback verisi:", { token, conversationId, appointmentId });

  if (!token || !conversationId || !appointmentId) {
    console.warn("Eksik veri:", { token, conversationId, appointmentId });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`);
  }

  const iyzipay = createIyzipayClient();

  try {
    const retrieveResult = await new Promise<any>((resolve, reject) => {
      iyzipay.payment.retrieve(
        {
          locale: Iyzipay.LOCALE.TR,
          conversationId,
          token,
        } as any,
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (!retrieveResult?.paymentId) {
      console.error("Payment retrieve hatası:", retrieveResult);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`);
    }

    const paymentId = retrieveResult.paymentId;

    const threedsResult = await new Promise<any>((resolve, reject) => {
      iyzipay.threedsPayment.create(
        {
          locale: Iyzipay.LOCALE.TR,
          token,
          conversationId,
          paymentId,
        } as any,
        (err2, result) => {
          if (err2) reject(err2);
          else resolve(result);
        }
      );
    });

    if (threedsResult.status !== "success") {
      console.error("3D Secure onay hatası:", threedsResult);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`);
    }

    try {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.SCHEDULED,
          confirmedAt: new Date(),
          finalPrice: parseFloat(threedsResult.paidPrice?.toString?.() ?? "0"),
          isPaid: true,
          paymentConversationId: threedsResult.conversationId,
          paidAt: new Date(),
        },
      });
    } catch (dbErr) {
      console.error("Veritabanı güncelleme hatası:", dbErr);
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/success?appointmentId=${appointmentId}&paidPrice=${threedsResult.paidPrice}`
    );
  } catch (e) {
    console.error("Ödeme işlemi genel hata:", e);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`);
  }
}
