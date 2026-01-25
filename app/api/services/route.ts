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

  const flatServices = services.map((service: any) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    image: service.image || null,
    price: service.price,
    petTags: service.tags
      .map((tag: any) => tag.pet?.species?.toUpperCase())
      .filter((species: any): species is string => Boolean(species)),
  }));

  return NextResponse.json(flatServices);
}
