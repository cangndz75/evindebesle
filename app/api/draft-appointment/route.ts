import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const schema = z.object({
  ownedPetIds: z.array(z.string().uuid()).min(1, "En az bir ownedPetId gerekli"),
  serviceIds: z.array(z.string().uuid()).min(1, "En az bir serviceId gerekli"),
  dates: z.array(z.string()).min(1, "En az bir tarih gerekli"),
  userAddressId: z.string().uuid("Geçersiz userAddressId"),
  timeSlot: z.string().optional(),
  isRecurring: z.boolean(),
  recurringType: z.string().optional(),
  recurringCount: z.number().int().min(1).optional(),

  // opsiyoneller
  isTest: z.boolean().optional(),
  totalPrice: z.number().min(0).optional(),
});

function toMidnightISO(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 Gelen draft verileri:", body);

    // backward compat: petIds → ownedPetIds
    if (Array.isArray(body.petIds) && !Array.isArray(body.ownedPetIds)) {
      body.ownedPetIds = body.petIds;
      delete body.petIds;
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.warn("⚠️ Geçersiz veri:", parsed.error);
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      ownedPetIds,
      serviceIds,
      dates,
      userAddressId,
      timeSlot,
      isRecurring,
      recurringType,
      recurringCount,
      isTest = false,
      totalPrice,
    } = parsed.data;

    // OwnedPet aitlik kontrolü
    const ownedPets = await prisma.ownedPet.findMany({
      where: { id: { in: ownedPetIds }, userId: session.user.id },
      select: { id: true, petId: true },
    });
    if (ownedPets.length !== ownedPetIds.length) {
      const valid = new Set(ownedPets.map((p) => p.id));
      const invalid = ownedPetIds.filter((id) => !valid.has(id));
      return NextResponse.json(
        { error: "Geçersiz veya yetkisiz ownedPetIds", invalidOwnedPetIds: invalid },
        { status: 400 }
      );
    }

    // Service doğrulama
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true },
    });
    if (services.length !== serviceIds.length) {
      const valid = new Set(services.map((s) => s.id));
      const invalid = serviceIds.filter((id) => !valid.has(id));
      return NextResponse.json(
        { error: "Geçersiz serviceId'ler", invalidServiceIds: invalid },
        { status: 400 }
      );
    }

    // Adres aitlik kontrolü
    const address = await prisma.userAddress.findFirst({
      where: { id: userAddressId, userId: session.user.id },
      select: { id: true },
    });
    if (!address) {
      return NextResponse.json(
        { error: "Geçersiz veya yetkisiz userAddressId" },
        { status: 400 }
      );
    }

    // Tarihleri normalize et
    const normalizedDates = dates
      .map(toMidnightISO)
      .filter((v): v is string => Boolean(v));
    if (normalizedDates.length === 0) {
      return NextResponse.json(
        { error: "Geçerli tarih bulunamadı" },
        { status: 400 }
      );
    }

    // petIds'i OwnedPet'ten türet
    const petIds = Array.from(
      new Set(ownedPets.map((p) => p.petId).filter(Boolean) as string[])
    );

    const draft = await prisma.draftAppointment.create({
      data: {
        userId: session.user.id,
        userAddressId,
        timeSlot: timeSlot ?? null,
        isRecurring,
        recurringType: recurringType ?? null,
        recurringCount: recurringCount ?? null,

      ...(typeof isTest === "boolean" ? { isTest } : {}),
      ...(typeof totalPrice === "number" ? { finalPrice: Number(totalPrice) } : {}),


        ownedPetIds,
        petIds,
        serviceIds,
        dates: normalizedDates,
      },
      select: { id: true },
    });

    console.log("✅ DraftAppointment oluşturuldu:", draft.id);

    return NextResponse.json(
      { success: true, draftAppointmentId: draft.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ POST /api/draft-appointment hatası:", error);
    return NextResponse.json(
      { error: "Draft appointment oluşturulamadı" },
      { status: 500 }
    );
  }
}
