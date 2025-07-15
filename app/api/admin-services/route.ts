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
  try {
    const body = await req.json();
    const { name, description, price, petIds } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "İsim ve fiyat gerekli" },
        { status: 400 }
      );
    }

    const service = await prisma.$transaction(async (tx) => {
      const created = await tx.service.create({
        data: {
          name,
          description: description || "",
          price: Number(price),
        },
      });

      if (petIds && Array.isArray(petIds) && petIds.length > 0) {
        await Promise.all(
          petIds.map((petId: string) =>
            tx.serviceTag.create({
              data: { serviceId: created.id, petId },
            })
          )
        );
      }

      return tx.service.findUniqueOrThrow({
        where: { id: created.id },
        include: { tags: { include: { pet: true } } },
      });
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("POST /api/services hata:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      { status: 500 }
    );
  }
}
