import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tags: {
        include: { pet: true },
      },
    },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, price, petIds } = body;

  if (!name || !price) {
    return NextResponse.json({ error: "İsim ve fiyat gerekli" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      name,
      description: description || "",
      price,
      tags: {
        create: petIds?.map((petId: string) => ({ petId })) || [],
      },
    },
    include: { tags: { include: { pet: true } } },
  });

  return NextResponse.json(service);
}
