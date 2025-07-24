import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          addresses: {
            where: { isPrimary: true },
            include: { district: true },
          },
        },
      },
      address: {
        include: { district: true },
      },
      services: {
        include: { service: true },
      },
      pets: {
        include: {
          ownedPet: true,
        },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const fallback = appointment.address || appointment.user.addresses?.[0];

  const normalized = {
    ...appointment,
    fullAddress: fallback?.fullAddress ?? "",
    district: fallback?.district ?? null,
    pets: appointment.pets
      .filter((p) => p.ownedPet !== null)
      .map((p) => ({
        id: p.ownedPet!.id,
        name: p.ownedPet!.name,
        image: p.ownedPet!.image,
        allergy: appointment.allergy,
        sensitivity: appointment.sensitivity,
        specialRequest: appointment.specialRequest,
        services: appointment.services,
      })),
  };

  return NextResponse.json({ data: normalized }, { status: 200 });
}
