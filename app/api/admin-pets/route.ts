import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { jsonNoStore, requireAdmin } from "@/lib/api/policy";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

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
  return jsonNoStore(pets);
}


export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const body = await req.json()
  const { name, image } = body
  const pet = await prisma.pet.create({
    data: { name, image },
  })
  return jsonNoStore(pet)
}