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
  allergy: z.array(z.string()).optional(), 
  sensitivity: z.string().nullable().optional(),
  specialNote: z.string().nullable().optional(),
  relation: z.string().nullable().optional(),
  allowAdUse: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownedPets = await prisma.ownedPet.findMany({
      where: { userId: session.user.id },
      include: { pet: true },
      orderBy: { createdAt: "desc" },
    });

    const formattedPets = ownedPets.map((up) => ({
      id: up.id,
      petName: up.pet?.name ?? "Bilinmeyen Hayvan",
      userPetName: up.name,
      image: up.image || up.pet?.image || null,
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
    }));

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createPetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: parsed.error },
        { status: 400 }
      );
    }

    const {
      petId,
      name,
      age,
      gender,
      image,
      allergy,
      sensitivity,
      specialNote,
      relation,
      allowAdUse,
    } = parsed.data;

    const petExists = await prisma.pet.findUnique({ where: { id: petId } });
    if (!petExists) {
      return NextResponse.json({ error: "Geçersiz petId" }, { status: 400 });
    }

    const created = await prisma.ownedPet.create({
      data: {
        user: { connect: { id: session.user.id } },
        pet: { connect: { id: petId } },
        name,
        age,
        gender,
        image,
        allergy,
        sensitivity,
        specialNote,
        relation,
        allowAdUse: allowAdUse ?? false,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("❌ POST /api/user-pets hatası:", error);
    return NextResponse.json(
      { error: "Evcil hayvan oluşturulamadı" },
      { status: 500 }
    );
  }
}