import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const speciesList = searchParams.getAll("species");

  console.log("API'ye gelen species:", speciesList); 

  if (speciesList.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      tags: {
        some: {
          pet: {
            species: {
              in: speciesList,
            },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      tags: {
        select: {
          pet: {
            select: {
              species: true,
            },
          },
        },
      },
    },
  });

  const flat = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price,
    petTags: s.tags.map((t) => t.pet?.species).filter(Boolean),
  }));

  return NextResponse.json(flat);
}