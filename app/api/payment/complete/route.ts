import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const { draftAppointmentId, paidPrice, conversationId } = await req.json();

    console.log("🔍 Gelen parametreler:", {
      draftAppointmentId,
      paidPrice,
      conversationId,
    });

    if (!draftAppointmentId || paidPrice === undefined || paidPrice === null) {
      console.warn("⚠️ Eksik temel parametre");
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    const draft = await prisma.draftAppointment.findUnique({
      where: { id: draftAppointmentId },
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
      console.warn("⚠️ Draft bulunamadı:", draftAppointmentId);
      return NextResponse.json({ error: "Draft bulunamadı" }, { status: 404 });
    }

console.log("🎯 Draft içeriği:", draft);

const petIds = Array.isArray(draft.petIds) ? draft.petIds : [];
const ownedPetIds = Array.isArray(draft.ownedPetIds) ? draft.ownedPetIds : [];
const serviceIds = Array.isArray(draft.serviceIds) ? draft.serviceIds : [];
const dateStrings = Array.isArray(draft.dates) ? draft.dates : [];

console.log("🔍 petIds:", petIds);
console.log("🔍 ownedPetIds:", ownedPetIds);
console.log("🔍 serviceIds:", serviceIds);
console.log("🔍 dateStrings:", dateStrings);

if (!petIds.length) return NextResponse.json({ error: "Eksik petIds" }, { status: 400 });
if (!ownedPetIds.length) return NextResponse.json({ error: "Eksik ownedPetIds" }, { status: 400 });
if (!serviceIds.length) return NextResponse.json({ error: "Eksik serviceIds" }, { status: 400 });
if (!dateStrings.length) return NextResponse.json({ error: "Eksik dates" }, { status: 400 });

    const dates = dateStrings
      .map((d: string) => {
        const date = new Date(d.trim());
        return isNaN(date.getTime()) ? null : date;
      })
      .filter((d): d is Date => d !== null);

    console.log("🗓️ Geçerli tarihler:", dates);

    const created = await prisma.appointment.create({
      data: {
        userId: draft.userId,
        userAddressId: draft.userAddressId,
        timeSlot: draft.timeSlot,
        isRecurring: draft.isRecurring,
        recurringType: draft.recurringType,
        recurringCount: draft.recurringCount,
        status: AppointmentStatus.SCHEDULED,
        finalPrice: parseFloat(String(paidPrice)),
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

    await prisma.draftAppointment.delete({ where: { id: draftAppointmentId } });

    console.log("✅ Randevu oluşturuldu:", created.id);

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
