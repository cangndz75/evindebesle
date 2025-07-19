import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const {
      petIds,         
      serviceIds,
      dates,
      isRecurring,
      recurringType,
      recurringCount,
      timeSlot,
      userNote,
      allergy,
      sensitivity,
      specialRequest,
    } = await req.json();

    if (!petIds?.length || !Array.isArray(dates) || dates.length === 0 || !timeSlot) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    const userPets = await prisma.ownedPet.findMany({
      where: { userId: user.id },
      select: { id: true, petId: true },
    });

    const matchedOwnedPets = userPets.filter((p) => petIds.includes(p.petId));
    const validOwnedPetIds = matchedOwnedPets.map((p) => p.id);

    if (validOwnedPetIds.length === 0) {
      return NextResponse.json({ error: "Geçerli bir pet bulunamadı" }, { status: 400 });
    }

    const primaryAddress = await prisma.userAddress.findFirst({
      where: {
        userId: user.id,
        isPrimary: true,
      },
    });

    if (!primaryAddress) {
      return NextResponse.json({ error: "Primary adres bulunamadı" }, { status: 400 });
    }

    const userAddressId = primaryAddress.id;
    const appointments = [];

    for (const ownedPetId of validOwnedPetIds) {
      for (const date of dates) {
      const appointment = await prisma.appointment.create({
        data: {
          userId: user.id,
          confirmedAt: new Date(date),
          status: "SCHEDULED",
          isRecurring: isRecurring || false,
          recurringCount: isRecurring ? recurringCount : null,
          repeatInterval: isRecurring ? recurringType : null,
          timeSlot,
          userNote: userNote || null,
          allergy: allergy || null,
          sensitivity: sensitivity || null,
          specialRequest: specialRequest || null,
          userAddressId,
          services: {
            create: serviceIds.map((serviceId: string) => ({
              serviceId,
            })),
          },
          pets: {
            create: [
              {
                ownedPetId,
              },
            ],
          },
        },
      });
        appointments.push(appointment);
      }
    }

    return NextResponse.json({ success: true, appointments });
  } catch (error) {
    console.error("Randevu oluşturma hatası:", error);
    return NextResponse.json(
      { success: false, message: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function GET() {
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
          include: {
            ownedPet: {
              include: {
                pet: true,
              },
            },
          },
        },
        services: {
          include: { service: true },
        },
        address: {
          include: { district: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error("Randevular getirme hatası:", error);
    return NextResponse.json(
      { success: false, message: "Randevular alınamadı." },
      { status: 500 }
    );
  }
}
