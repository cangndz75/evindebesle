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

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const token = formData.get("token")?.toString();
  const conversationId = formData.get("conversationId")?.toString();
  const appointmentId = req.nextUrl.searchParams.get("appointmentId");

  console.log("📥 Gelen callback verisi:", { token, conversationId, appointmentId });

  if (!token || !conversationId || !appointmentId) {
    console.warn("⚠️ Eksik veri:", { token, conversationId, appointmentId });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`);
  }

  const iyzipay = createIyzipayClient();

  return new Promise((resolve) => {
    iyzipay.payment.retrieve(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId,
        token,
      } as any,
      (err, retrieveResult) => {
        if (err || !retrieveResult?.paymentId) {
          console.error("❌ Payment retrieve hatası:", err || retrieveResult);
          return resolve(
            NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`)
          );
        }

        const paymentId = retrieveResult.paymentId;

        iyzipay.threedsPayment.create(
          {
            locale: Iyzipay.LOCALE.TR,
            token,
            conversationId,
            paymentId,
          } as any,
          async (err2, result) => {
            if (err2 || result?.status !== "success") {
              console.error("💥 3D Secure onay hatası:", err2 || result);
              return resolve(
                NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`)
              );
            }

            try {
              await prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                  status: AppointmentStatus.SCHEDULED,
                  confirmedAt: new Date(),
                  finalPrice: parseFloat(result.paidPrice?.toString?.() ?? ""),
                  isPaid: true,
                  paymentConversationId: result.conversationId,
                  paidAt: new Date(),
                },
              });
            } catch (e) {
              console.error("❌ Veritabanı güncelleme hatası:", e);
            }

            return resolve(
              NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_SITE_URL}/success?appointmentId=${appointmentId}&paidPrice=${result.paidPrice}`
              )
            );
          }
        );
      }
    );
  });
}
