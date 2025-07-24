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

    const petIds = draft.petIds?.split(",").filter((id: string) => id.trim().length > 0) || [];
    const serviceIds = draft.serviceIds?.split(",").filter((id: string) => id.trim().length > 0) || [];
    const dateStrings = draft.dates?.split(",").filter((d: string) => d.trim().length > 0) || [];
    const dates = dateStrings
      .map((d) => {
        const date = new Date(d.trim());
        return isNaN(date.getTime()) ? null : date;
      })
      .filter((d): d is Date => d !== null);

    console.log("📆 Seçilen tarih sayısı:", dates.length);
    console.log("🐾 Pet sayısı:", petIds.length);
    console.log("🧼 Hizmet sayısı:", serviceIds.length);

    if (!petIds.length || !serviceIds.length || !dates.length) {
      console.warn("❌ Eksik draft verisi:", { petIds, serviceIds, dates });
      return NextResponse.json({ error: "Eksik draft verisi (petIds, serviceIds veya dates)" }, { status: 400 });
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
          create: serviceIds.map((id: string) => ({ serviceId: id })),
        },
        pets: {
          create: petIds.map((id: string) => ({ ownedPetId: id })),
        },
        dates: {
          create: dates.map((d: Date) => ({ date: d })),
        },
      },
    });

    console.log("🗑️ Draft siliniyor:", draft.id);
    await prisma.draftAppointment.delete({ where: { id: appointmentId } });

    console.log("✅ Randevu oluşturuldu:", created.id);

    return NextResponse.json(
      { success: true, appointmentId: created.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 payment/complete rotasında kritik hata:", error);
    if (error instanceof Error) {
      console.error("📌 Stack Trace:", error.stack);
      return NextResponse.json(
        { error: error.message || "Randevu oluşturulamadı" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Bilinmeyen bir hata nedeniyle randevu oluşturulamadı." },
      { status: 500 }
    );
  }
}