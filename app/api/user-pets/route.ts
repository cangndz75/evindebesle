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
      name: up.name ?? up.pet?.name,            
      petType: up.pet?.name,                     
      image: up.image || up.pet?.image,
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
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const body = await req.json();
  const {
    petId,          
    name,
    age,
    gender,
    image,
    relation,
    allergy,
    sensitivity,
    specialNote,
    allowAdUse,
  } = body;

  const userPet = await prisma.userPet.create({
    data: {
      userId: session.user.id,
      petId,
      name,
      age,
      gender,
      image,
      relation,
      allergy,
      sensitivity,
      specialNote,
      allowAdUse: !!allowAdUse,
    }
  });

  return NextResponse.json(userPet);
}
