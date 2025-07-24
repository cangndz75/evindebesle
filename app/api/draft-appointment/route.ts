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
    petIds = [],
    ownedPetIds = [],
    serviceIds = [],
    dates = [],
    userAddressId,
    timeSlot,
    isRecurring,
    recurringType,
    recurringCount,
  } = await req.json();

  const userId = session.user.id;

  try {
    // ✅ 1. Kullanıcıya ait mi? (OwnedPet doğrulama)
    const validOwnedPets = await prisma.ownedPet.findMany({
      where: {
        id: { in: ownedPetIds },
        userId,
      },
      select: { id: true },
    });
    if (validOwnedPets.length !== ownedPetIds.length) {
      return NextResponse.json({ error: "Geçersiz veya size ait olmayan ownedPet ID'leri" }, { status: 400 });
    }

    // ✅ 2. Pet ID'leri sistemde var mı?
    const validPets = await prisma.pet.findMany({
      where: {
        id: { in: petIds },
      },
      select: { id: true },
    });
    if (validPets.length !== petIds.length) {
      return NextResponse.json({ error: "Geçersiz pet ID'leri" }, { status: 400 });
    }

    // ✅ 3. Hizmet ID’leri sistemde var mı ve aktif mi?
    const validServices = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true,
      },
      select: { id: true },
    });
    if (validServices.length !== serviceIds.length) {
      return NextResponse.json({ error: "Geçersiz veya pasif hizmet ID'leri" }, { status: 400 });
    }

    // ✅ 4. Adres kullanıcıya mı ait?
    const address = await prisma.userAddress.findFirst({
      where: {
        id: userAddressId,
        userId,
      },
    });
    if (!address) {
      return NextResponse.json({ error: "Adres size ait değil veya geçersiz" }, { status: 400 });
    }

    const draft = await prisma.draftAppointment.create({
      data: {
        userId,
        petIds,
        ownedPetIds,
        serviceIds,
        dates,
        userAddressId,
        timeSlot,
        isRecurring: Boolean(isRecurring),
        recurringType: recurringType || null,
        recurringCount: recurringCount || null,
      },
    });

    return NextResponse.json({ id: draft.id });
  } catch (err) {
    console.error("❌ Draft oluşturma hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası oluştu" }, { status: 500 });
  }
}
