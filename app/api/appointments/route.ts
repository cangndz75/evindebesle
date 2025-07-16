import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const user = session?.user;

    if (!user || !user.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const {
      serviceIds,
      dates,
      isRecurring,
      recurringType,
      recurringCount,
      timeSlot,
      userNote,
    } = await req.json();

    const ownedPet = await prisma.ownedPet.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!ownedPet) {
      return NextResponse.json(
        { error: "Kullanıcıya ait bir evcil hayvan bulunamadı" },
        { status: 400 }
      );
    }

    const appointments = [];

    for (const date of dates) {
      const appointment = await prisma.appointment.create({
        data: {
          userId: user.id,
          ownedPetId: ownedPet.id,
          confirmedAt: new Date(date),
          status: "SCHEDULED",
          isRecurring: isRecurring || false,
          repeatCount: isRecurring ? recurringCount : null,
          repeatInterval: isRecurring ? recurringType : null,
          timeSlot: timeSlot || null,
          userNote: userNote || null,
          services: {
            create: serviceIds.map((serviceId: string) => ({
              serviceId,
            })),
          },
        },
      });

      appointments.push(appointment);
    }

    return NextResponse.json({ success: true, appointments }, { status: 200 });
  } catch (error) {
    console.error("Hata:", error);
    return NextResponse.json(
      { success: false, message: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}
