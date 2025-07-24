import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, paidPrice, conversationId } = await req.json();

    if (!appointmentId || paidPrice === undefined || paidPrice === null) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const draft = await prisma.draftAppointment.findUnique({
      where: { id: appointmentId },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft bulunamadı" }, { status: 404 });
    }

    // Güvenlik kontrolü: Draft verilerini temizle ve doğrula
    const petIds = Array.isArray(draft.petIds) ? draft.petIds : [];
    const ownedPetIds = Array.isArray(draft.ownedPetIds) ? draft.ownedPetIds : [];
    const serviceIds = Array.isArray(draft.serviceIds) ? draft.serviceIds : [];
    const dateStrings = Array.isArray(draft.dates) ? draft.dates : [];

    if (!petIds.length || !ownedPetIds.length || !serviceIds.length || !dateStrings.length) {
      return NextResponse.json({ error: "Eksik draft verisi" }, { status: 400 });
    }

    const dates = dateStrings
      .map((d: string) => {
        const date = new Date(d.trim());
        return isNaN(date.getTime()) ? null : date;
      })
      .filter((d): d is Date => d !== null);

    // ✅ Gerçek randevuyu oluştur
    const created = await prisma.appointment.create({
      data: {
        userId: draft.userId,
        userAddressId: draft.userAddressId,
        timeSlot: draft.timeSlot,
        isRecurring: draft.isRecurring,
        recurringType: draft.recurringType,
        recurringCount: draft.recurringCount,
        status: AppointmentStatus.SCHEDULED,
        finalPrice: parseFloat(paidPrice),
        paidAt: new Date(),
        isPaid: true,
        confirmedAt: new Date(),
        paymentConversationId: conversationId || null,

        services: {
          create: serviceIds.map((id) => ({ serviceId: id })),
        },
        pets: {
          create: ownedPetIds.map((id) => ({ ownedPetId: id })),
        },
        dates: {
          create: dates.map((d) => ({ date: d })),
        },
      },
    });

    await prisma.draftAppointment.delete({ where: { id: appointmentId } });

    return NextResponse.json(
      { success: true, appointmentId: created.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 payment/complete hatası:", error);
    return NextResponse.json(
      { error: "Randevu oluşturulamadı" },
      { status: 500 }
    );
  }
}
