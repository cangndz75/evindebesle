import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const pets = await prisma.pet.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      species: true,
      breed: true,
    },
    orderBy: { name: "asc" }
  });
  return NextResponse.json(pets);
}


export async function POST(req: Request) {
  const body = await req.json()
  const { name, image } = body
  const pet = await prisma.pet.create({
    data: { name, image },
  })
  return NextResponse.json(pet)
}