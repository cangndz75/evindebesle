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
  const draftAppointmentId = req.nextUrl.searchParams.get("draftAppointmentId");

  if (!token || !conversationId || !draftAppointmentId) {
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

    const paymentId = retrieveResult?.paymentId;
    if (!paymentId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`);
    }

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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`);
    }

    // 🔍 1. Draft'ı getir
    const draft = await prisma.draftAppointment.findUnique({
      where: { id: draftAppointmentId },
    });
    if (!draft) throw new Error("Draft bulunamadı.");

    // 🔧 2. Randevuyu oluştur
    const newAppointment = await prisma.appointment.create({
      data: {
        userId: draft.userId,
        userAddressId: draft.userAddressId || undefined,
        timeSlot: draft.timeSlot || undefined,
        confirmedAt: new Date(),
        isRecurring: draft.isRecurring || false,
        recurringType: draft.recurringType || undefined,
        recurringCount: draft.recurringCount || undefined,
        finalPrice: parseFloat(threedsResult.paidPrice?.toString?.() ?? "0"),
        isPaid: true,
        paidAt: new Date(),
        paymentConversationId: conversationId,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    const appointmentId = newAppointment.id;

    const petIds: string[] = JSON.parse(draft.petIds || "[]");
    await prisma.appointmentPet.createMany({
      data: petIds.map((petId) => ({
        appointmentId,
        ownedPetId: petId,
      })),
    });


    const serviceIds: string[] = JSON.parse(draft.serviceIds || "[]");
    await prisma.appointmentService.createMany({
      data: serviceIds.map((serviceId) => ({
        appointmentId,
        serviceId,
      })),
    });

    const dateStrings: string[] = JSON.parse(draft.dates || "[]");
    await prisma.appointmentDate.createMany({
      data: dateStrings.map((d) => ({
        appointmentId,
        date: new Date(d),
      })),
    });

    // ✅ 6. Draft'ı sil
    await prisma.draftAppointment.delete({
      where: { id: draftAppointmentId },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/success?appointmentId=${appointmentId}&paidPrice=${threedsResult.paidPrice}`
    );
  } catch (err) {
    console.error("Ödeme sonrası hata:", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/payment-failed`);
  }
}
