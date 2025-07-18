import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      pets: {
        include: {
          ownedPet: {
            select: {
              id: true,
              name: true,
              image: true,
              age: true,
              gender: true,
              relation: true,
              pet: {
                select: {
                  species: true,
                },
              },
            },
          },
        },
      },
      address: {
        select: {
          id: true,
          fullAddress: true,
          district: {
            select: {
              name: true,
            },
          },
        },
      },
      services: {
        include: {
          service: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      },
      media: {
        select: {
          id: true,
          type: true,
          url: true,
        },
      },
      checkItems: true,
      reviews: true,
      invoice: true,
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({ data: appointment });
}
