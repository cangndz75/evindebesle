import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const userPets = await prisma.userPet.findMany({
    where: { userId: session.user.id },
    include: { pet: true },
    orderBy: { createdAt: "desc" }
  });

    return NextResponse.json(
    userPets.map(up => ({
        id: up.id,
        petName: up.pet?.name,
        userPetName: up.name,
        image: up.image && up.image.length > 0 ? up.image : up.pet?.image ? [up.pet?.image] : [],
        species: up.pet?.species,
        breed: up.pet?.breed,
        age: up.age,
        gender: up.gender,
        relation: up.relation,
        allergy: up.allergy,
        sensitivity: up.sensitivity,
        specialNote: up.specialNote,
        allowAdUse: up.allowAdUse,
        createdAt: up.createdAt,
    }))
    );
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

    const created = await prisma.userPet.create({
    data: {
        user: {
        connect: { id: session.user.id } 
        },
        pet: {
        connect: { id: body.petId } 
        },
        name: body.name,
        age: body.age,
        gender: body.gender ?? null,
        image: body.image ?? null,
        allergy: body.allergy || null,
        sensitivity: body.sensitivity || null,
        specialNote: body.specialNote || null,
        relation: body.relation || null,
        allowAdUse: body.allowAdUse ?? false,
    },
    });

  return NextResponse.json(created);
}