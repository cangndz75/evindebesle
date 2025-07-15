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

  return NextResponse.json(userPets.map(up => ({
    id: up.id,
    petName: up.pet?.name,
    userPetName: up.name,
    species: up.pet?.species,
    breed: up.pet?.breed,
    age: up.age,
    gender: up.gender,
    image: up.image || up.pet?.image,
    relation: up.relation,
    allergy: up.allergy,
    sensitivity: up.sensitivity,
    specialNote: up.specialNote,
    allowAdUse: up.allowAdUse,
  })));
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const body = await req.json();
  const {
    petName, petImage, species, breed,
    userPetName, age, gender, relation, allergy, sensitivity, specialNote, allowAdUse
  } = body;

  const pet = await prisma.pet.create({
    data: {
      name: petName,
      image: petImage,
      species,
      breed,
    }
  });

  const userPet = await prisma.userPet.create({
    data: {
      userId: session.user.id,
      petId: pet.id,
      name: userPetName,
      age,
      gender,
      relation,
      allergy,
      sensitivity,
      specialNote,
      allowAdUse,
      image: petImage,
    }
  });

  return NextResponse.json({ success: true, userPet });
}
