import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { z } from "zod";
import { AppointmentStatus } from "@/lib/generated/prisma";
import { generateAndSaveInvoice } from "@/lib/invoice/generateAndSaveInvoice";

const completeSchema = z.object({
  draftAppointmentId: z.string().uuid("Geçersiz draftAppointmentId"),
  paidPrice: z.number().positive("Geçersiz paidPrice"),
  conversationId: z.string().optional(),
  paymentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.warn("❌ Yetkisiz istek: Kullanıcı oturumu bulunamadı");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 Complete isteği alındı:", body);

    // Zod ile veri doğrulama
    const parsedBody = completeSchema.safeParse(body);
    if (!parsedBody.success) {
      console.warn("⚠️ Geçersiz veri:", parsedBody.error);
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsedBody.error },
        { status: 400 }
      );
    }

    const { draftAppointmentId, paidPrice, conversationId, paymentId } = parsedBody.data;

    // Draft kaydını çek
    const draft = await prisma.draftAppointment.findUnique({
      where: { id: draftAppointmentId, userId: session.user.id }, // userId kontrolü eklendi
      select: {
        id: true,
        userId: true,
        userAddressId: true,
        isRecurring: true,
        recurringType: true,
        recurringCount: true,
        timeSlot: true,
        couponId: true,
        userNote: true,
        allergy: true,
        sensitivity: true,
        specialRequest: true,
        petIds: true,
        ownedPetIds: true,
        serviceIds: true,
        dates: true,
      },
    });

    if (!draft) {
      console.warn("⚠️ Draft bulunamadı veya yetkisiz:", { draftAppointmentId, userId: session.user.id });
      return NextResponse.json({ error: "Draft bulunamadı veya yetkisiz" }, { status: 404 });
    }

    console.log("🎯 Draft içeriği:", draft);

    // Dizileri güvenli bir şekilde al
    const petIds = Array.isArray(draft.petIds) ? draft.petIds : [];
    const ownedPetIds = Array.isArray(draft.ownedPetIds) ? draft.ownedPetIds : [];
    const serviceIds = Array.isArray(draft.serviceIds) ? draft.serviceIds : [];
    const dateStrings = Array.isArray(draft.dates) ? draft.dates : [];

    console.log("🔍 petIds:", petIds);
    console.log("🔍 ownedPetIds:", ownedPetIds);
    console.log("🔍 serviceIds:", serviceIds);
    console.log("🔍 dateStrings:", dateStrings);

    // Dizi doğrulamaları
    if (!petIds.length) {
      console.warn("⚠️ Eksik petIds:", { draftAppointmentId });
      return NextResponse.json({ error: "petIds boş" }, { status: 400 });
    }
    if (!serviceIds.length) {
      console.warn("⚠️ Eksik serviceIds:", { draftAppointmentId });
      return NextResponse.json({ error: "serviceIds boş" }, { status: 400 });
    }
    if (!dateStrings.length) {
      console.warn("⚠️ Eksik dateStrings:", { draftAppointmentId });
      return NextResponse.json({ error: "dates boş" }, { status: 400 });
    }

    // ownedPetIds doğrulamasını kaldır
    if (ownedPetIds.length > 0) {
      const ownedPets = await prisma.ownedPet.findMany({
        where: { id: { in: ownedPetIds }, userId: session.user.id },
      });
      if (ownedPets.length !== ownedPetIds.length) {
        console.warn("⚠️ Geçersiz veya yetkisiz ownedPetIds:", ownedPetIds);
        return NextResponse.json(
          { error: "Geçersiz veya yetkisiz ownedPetIds" },
          { status: 400 }
        );
      }
    }

    // Tarihlerin geçerli olduğunu doğrula
    const dates = dateStrings
      .map((d: string) => {
        const date = new Date(d.trim());
        return isNaN(date.getTime()) ? null : date;
      })
      .filter((d): d is Date => d !== null);

    if (!dates.length) {
      console.warn("⚠️ Geçersiz tarihler:", dateStrings);
      return NextResponse.json({ error: "Geçerli tarih bulunamadı" }, { status: 400 });
    }

    console.log("🗓️ Geçerli tarihler:", dates);

    // Randevu oluştur
    const created = await prisma.appointment.create({
      data: {
        userId: draft.userId,
        userAddressId: draft.userAddressId,
        timeSlot: draft.timeSlot,
        isRecurring: draft.isRecurring,
        recurringType: draft.recurringType,
        recurringCount: draft.recurringCount,
        status: AppointmentStatus.SCHEDULED,
        finalPrice: paidPrice,
        paidAt: new Date(),
        isPaid: true,
        confirmedAt: new Date(),
        paymentConversationId: conversationId || null,
        paymentId: paymentId || null,
        couponId: draft.couponId,
        userNote: draft.userNote,
        allergy: draft.allergy,
        sensitivity: draft.sensitivity,
        specialRequest: draft.specialRequest,
        services: {
          create: serviceIds.map((id) => ({
            service: { connect: { id } }, // Doğru ilişki bağlantısı
          })),
        },
        pets: {
          create: petIds.map((petId, index) => ({
            pet: { connect: { id: petId } },
            ownedPet: ownedPetIds[index] ? { connect: { id: ownedPetIds[index] } } : undefined,
          })),
        },
        dates: {
          create: dates.map((d) => ({ date: d })),
        },
      },
    });

    await prisma.draftAppointment.delete({ where: { id: draftAppointmentId } });

    if (draft.couponId) {
      const existingUsage = await prisma.appointment.findFirst({
        where: {
          userId: session.user.id,
          couponId: draft.couponId,
          isPaid: true,
        },
      });

      if (!existingUsage) {
        await prisma.$transaction([
          prisma.coupon.update({
            where: { id: draft.couponId },
            data: {
              usageCount: { increment: 1 },
            },
          }),
          prisma.userCoupon.updateMany({
            where: {
              userId: session.user.id,
              couponId: draft.couponId,
            },
            data: {
              usedAt: new Date(),
            },
          }),
        ]);
      }
    }

    console.log("✅ Randevu oluşturuldu:", created.id);

    await generateAndSaveInvoice(created.id);

    return NextResponse.json(
      { success: true, appointmentId: created.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 payment/complete hatası:", error);
    return NextResponse.json(
      { error: "Randevu oluşturulamadı", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}