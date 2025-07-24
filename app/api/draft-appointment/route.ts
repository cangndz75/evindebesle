import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { z } from "zod";

const draftAppointmentSchema = z.object({
  petIds: z.array(z.string().uuid()).min(1, "En az bir petId gerekli"),
  ownedPetIds: z.array(z.string().uuid()).optional(),
  serviceIds: z.array(z.string().uuid()).min(1, "En az bir serviceId gerekli"),
  dates: z.array(z.string()).min(1, "En az bir tarih gerekli"),
  userAddressId: z.string().uuid("Geçersiz userAddressId"),
  timeSlot: z.string().optional(),
  isRecurring: z.boolean(),
  recurringType: z.string().optional(),
  recurringCount: z.number().int().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.warn("❌ Yetkisiz istek: Kullanıcı oturumu bulunamadı");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 Gelen draft verileri:", body);

    // userPetId yerine ownedPetIds olarak düzelt
    if (body.userPetId) {
      body.ownedPetIds = Array.isArray(body.userPetId) ? body.userPetId : [body.userPetId];
      delete body.userPetId;
    }

    const parsedBody = draftAppointmentSchema.safeParse(body);
    if (!parsedBody.success) {
      console.warn("⚠️ Geçersiz veri:", parsedBody.error);
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsedBody.error },
        { status: 400 }
      );
    }

    const {
      petIds,
      ownedPetIds = [],
      serviceIds,
      dates,
      userAddressId,
      timeSlot,
      isRecurring,
      recurringType,
      recurringCount,
    } = parsedBody.data;

    const pets = await prisma.pet.findMany({
      where: { id: { in: petIds } },
    });
    if (pets.length !== petIds.length) {
      console.warn("⚠️ Geçersiz petIds:", petIds);
      return NextResponse.json({ error: "Geçersiz petId'ler" }, { status: 400 });
    }

    if (ownedPetIds.length > 0) {
      const ownedPets = await prisma.ownedPet.findMany({
        where: { id: { in: ownedPetIds }, userId: session.user.id },
      });
      if (ownedPets.length !== ownedPetIds.length) {
        console.warn("⚠️ Geçersiz veya yetkisiz ownedPetIds:", ownedPetIds);
        return NextResponse.json(
          { error: "Geçersiz veya yetkisiz ownedPetIds" },
          { status: 400 }
        );
      }
    }

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });
    if (services.length !== serviceIds.length) {
      console.warn("⚠️ Geçersiz serviceIds:", serviceIds);
      return NextResponse.json({ error: "Geçersiz serviceId'ler" }, { status: 400 });
    }

    const address = await prisma.userAddress.findFirst({
      where: { id: userAddressId, userId: session.user.id },
    });
    if (!address) {
      console.warn("⚠️ Geçersiz veya yetkisiz userAddressId:", userAddressId);
      return NextResponse.json(
        { error: "Geçersiz veya yetkisiz userAddressId" },
        { status: 400 }
      );
    }

    const draftAppointment = await prisma.draftAppointment.create({
      data: {
        userId: session.user.id, // Doğrudan userId
        userAddressId, // Doğrudan userAddressId
        petIds,
        ownedPetIds,
        serviceIds,
        dates,
        timeSlot,
        isRecurring,
        recurringType,
        recurringCount,
      },
    });

    console.log("✅ DraftAppointment oluşturuldu:", draftAppointment.id);

    return NextResponse.json({
      success: true,
      data: { draftAppointmentId: draftAppointment.id, ...draftAppointment },
    });
  } catch (error) {
    console.error("❌ POST /api/draft-appointment hatası:", error);
    return NextResponse.json(
      { error: "Draft appointment oluşturulamadı" },
      { status: 500 }
    );
  }
}