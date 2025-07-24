import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { z } from "zod";

const createPetSchema = z.object({
  petId: z.string().uuid("Geçersiz petId formatı"),
  name: z.string().optional(),
  age: z.number().int().min(0).optional(),
  gender: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  allergy: z.string().nullable().optional(),
  sensitivity: z.string().nullable().optional(),
  specialNote: z.string().nullable().optional(),
  relation: z.string().nullable().optional(),
  allowAdUse: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.warn("❌ Yetkisiz istek: Kullanıcı oturumu bulunamadı");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("📥 OwnedPet verileri çekiliyor:", { userId: session.user.id });

    const ownedPets = await prisma.ownedPet.findMany({
      where: { userId: session.user.id },
      include: { pet: true },
      orderBy: { createdAt: "desc" },
    });

    const formattedPets = ownedPets.map((up) => {
      let image: string | null = null;
      if (up.image) image = up.image;
      else if (up.pet?.image) image = up.pet.image;

      return {
        id: up.id,
        petName: up.pet?.name ?? "Bilinmeyen Hayvan",
        userPetName: up.name,
        image,
        species: up.pet?.species ?? "Bilinmeyen Tür",
        breed: up.pet?.breed,
        age: up.age,
        gender: up.gender,
        relation: up.relation,
        allergy: up.allergy,
        sensitivity: up.sensitivity,
        specialNote: up.specialNote,
        allowAdUse: up.allowAdUse,
        createdAt: up.createdAt,
      };
    });

    console.log("✅ OwnedPet verileri döndürüldü:", { count: formattedPets.length });

    return NextResponse.json(formattedPets);
  } catch (error) {
    console.error("❌ GET /api/user-pets hatası:", error);
    return NextResponse.json(
      { error: "Evcil hayvanlar alınamadı" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      console.warn("❌ Yetkisiz istek: Kullanıcı oturumu bulunamadı");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 POST /api/user-pets gelen veri:", body);

    // Veri doğrulama
    const parsedBody = createPetSchema.safeParse(body);
    if (!parsedBody.success) {
      console.warn("⚠️ Geçersiz veri:", parsedBody.error);
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsedBody.error },
        { status: 400 }
      );
    }

    // petId'nin varlığını kontrol et
    const petExists = await prisma.pet.findUnique({
      where: { id: parsedBody.data.petId },
    });
    if (!petExists) {
      console.warn("⚠️ Pet bulunamadı:", parsedBody.data.petId);
      return NextResponse.json({ error: "Geçersiz petId" }, { status: 400 });
    }

    const created = await prisma.ownedPet.create({
      data: {
        user: {
          connect: { id: session.user.id },
        },
        pet: {
          connect: { id: parsedBody.data.petId },
        },
        name: parsedBody.data.name,
        age: parsedBody.data.age,
        gender: parsedBody.data.gender ?? null,
        image: parsedBody.data.image || null,
        allergy: parsedBody.data.allergy || null,
        sensitivity: parsedBody.data.sensitivity || null,
        specialNote: parsedBody.data.specialNote || null,
        relation: parsedBody.data.relation || null,
        allowAdUse: parsedBody.data.allowAdUse ?? false,
      },
    });

    console.log("✅ OwnedPet oluşturuldu:", created.id);

    return NextResponse.json(created);
  } catch (error) {
    console.error("❌ POST /api/user-pets hatası:", error);
    return NextResponse.json(
      { error: "Evcil hayvan oluşturulamadı" },
      { status: 500 }
    );
  }
}