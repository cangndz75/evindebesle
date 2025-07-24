import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    petIds,          // sistemdeki sabit pet tablosundakiler
    ownedPetIds,     // kullanıcıya ait olanlar
    serviceIds,
    dates,
    userAddressId,
    timeSlot,
    isRecurring,
    recurringType,
    recurringCount,
  } = await req.json();

  try {
    if ((!petIds || petIds.length === 0) && (!ownedPetIds || ownedPetIds.length === 0)) {
      return NextResponse.json({ error: "En az bir pet seçilmelidir." }, { status: 400 });
    }

    const draft = await prisma.draftAppointment.create({
      data: {
        userId: session.user.id,
        petIds: petIds || [],
        ownedPetIds: ownedPetIds || [],
        serviceIds: serviceIds || [],
        dates: dates || [],
        userAddressId,
        timeSlot,
        isRecurring: Boolean(isRecurring),
        recurringType,
        recurringCount,
      },
    });

    return NextResponse.json({ draftAppointmentId: draft.id });
  } catch (err) {
    console.error("Draft oluşturma hatası:", err);
    return NextResponse.json({ error: "DB Hatası" }, { status: 500 });
  }
}
