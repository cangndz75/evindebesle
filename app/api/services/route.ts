import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      tags: {
        include: {
          pet: true,
        },
      },
    },
  });

  const flatServices = services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.price,
    petTags: service.tags
      .map((tag) => tag.pet?.species?.toUpperCase())
      .filter((species): species is string => Boolean(species)),
  }));

  return NextResponse.json(flatServices);
}
