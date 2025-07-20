import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, paidPrice } = await req.json();

    if (!appointmentId || typeof paidPrice === "undefined") {
      console.warn("❌ Eksik parametre:", { appointmentId, paidPrice });
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const draft = await prisma.draftAppointment.findUnique({
      where: { id: appointmentId },
    });

    if (!draft) {
      console.warn("❌ Draft bulunamadı:", appointmentId);
      return NextResponse.json({ error: "Draft bulunamadı" }, { status: 404 });
    }

    const petIds = draft.petIds?.split(",") ?? [];
    const serviceIds = draft.serviceIds?.split(",") ?? [];
    const dates = draft.dates?.split(",").map((d) => new Date(d)) ?? [];

    if (!petIds.length || !serviceIds.length || !dates.length) {
      return NextResponse.json(
        { error: "Eksik draft verisi" },
        { status: 400 }
      );
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

        services: {
          create: serviceIds.map((id) => ({ serviceId: id })),
        },

        pets: {
          create: petIds.map((id) => ({ ownedPetId: id })),
        },

        dates: {
          create: dates.map((d) => ({ date: d })),
        },
      },
    });

    await prisma.draftAppointment.delete({
      where: { id: appointmentId },
    });

    console.log("✅ Randevu başarıyla oluşturuldu:", created.id);

    return NextResponse.json(
      { success: true, appointmentId: created.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 payment/complete hata:", error);
    return NextResponse.json(
      { error: "Randevu oluşturulamadı" },
      { status: 500 }
    );
  }
}
