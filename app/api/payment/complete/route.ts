import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, paidPrice, conversationId } = await req.json();

    console.log("🔔 Gelen veri:", { appointmentId, paidPrice, conversationId });

    if (!appointmentId || typeof paidPrice === "undefined" || paidPrice === null) {
      console.warn("❌ Eksik parametre:", { appointmentId, paidPrice });
      return NextResponse.json({ error: "Eksik parametre (appointmentId veya paidPrice)" }, { status: 400 });
    }

    const draft = await prisma.draftAppointment.findUnique({
      where: { id: appointmentId },
    });

    console.log("🧾 Draft bulundu mu?", draft ? "Evet ✅" : "Hayır ❌");

    if (!draft) {
      return NextResponse.json({ error: "Draft bulunamadı" }, { status: 404 });
    }

    const petIds = Array.isArray(draft.petIds) ? draft.petIds : [];
    const ownedPetIds = Array.isArray(draft.ownedPetIds) ? draft.ownedPetIds : [];
    const serviceIds = Array.isArray(draft.serviceIds) ? draft.serviceIds : [];
    const dateStrings = Array.isArray(draft.dates) ? draft.dates : [];

    const dates = dateStrings
      .map((d: string) => {
        const date = new Date(d.trim());
        return isNaN(date.getTime()) ? null : date;
      })
      .filter((d): d is Date => d !== null);

    if ((!petIds.length && !ownedPetIds.length) || !serviceIds.length || !dates.length) {
      return NextResponse.json({ error: "Eksik draft verisi (petIds/ownedPetIds, serviceIds veya dates)" }, { status: 400 });
    }

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
          create: [
            ...ownedPetIds.map((id) => ({ ownedPetId: id })),
            ...petIds.map((id) => ({ petId: id })),
          ],
        },

        dates: {
          create: dates.map((date) => ({ date })),
        },
      },
    });

    await prisma.draftAppointment.delete({ where: { id: appointmentId } });

    return NextResponse.json({ success: true, appointmentId: created.id }, { status: 200 });
  } catch (error) {
    console.error("💥 payment/complete rotasında kritik hata:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || "Randevu oluşturulamadı" }, { status: 500 });
    }
    return NextResponse.json({ error: "Bilinmeyen bir hata nedeniyle randevu oluşturulamadı." }, { status: 500 });
  }
}
