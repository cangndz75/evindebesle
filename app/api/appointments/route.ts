import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";

// GET → Kullanıcının kendi randevularını getir
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId: user.id },
      orderBy: { confirmedAt: "desc" },
      include: {
        pets: {
          select: {
            ownedPet: {
              select: { name: true },
            },
          },
        },
        services: {
          include: {
            service: {
              select: { name: true },
            },
          },
        },
        address: {
          select: {
            fullAddress: true,
            district: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: appointments }, { status: 200 });
  } catch (error) {
    console.error("📛 Kullanıcı randevu listesi hatası:", error);
    return NextResponse.json(
      { success: false, message: "Randevular alınamadı." },
      { status: 500 }
    );
  }
}


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
    const serviceIds = Array.isArray(draft.serviceIds) ? draft.serviceIds : [];
    const dateStrings = Array.isArray(draft.dates) ? draft.dates : [];
    const dates = dateStrings
      .map((d: string) => {
        const date = new Date(d.trim());
        return isNaN(date.getTime()) ? null : date;
      })
      .filter((d): d is Date => d !== null);

    console.log("📋 petIds:", petIds);
    console.log("📋 serviceIds:", serviceIds);
    console.log("📋 dateStrings:", dateStrings);

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
        couponId: draft.couponId,
        userNote: draft.userNote,
        allergy: draft.allergy,
        sensitivity: draft.sensitivity,
        specialRequest: draft.specialRequest,
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
          create: petIds.map((id: string) => ({
            ownedPet: { connect: { id } },
          })),
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
