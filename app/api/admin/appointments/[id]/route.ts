import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1]; 

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
      ownedPet: {
        include: {
          pet: true,
        },
      },
      address: {
        include: {
          district: true,
        },
      },
      services: {
        include: {
          service: true,
        },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const fallbackAddress = appointment.address || appointment.user?.addresses?.[0];

  const normalized = {
    ...appointment,
    fullAddress: fallbackAddress?.fullAddress || "",
    district: fallbackAddress?.district || null,
    pets: [
      {
        id: appointment.ownedPet.id,
        name: appointment.ownedPet.name,
        image: appointment.ownedPet.image,
        allergy: appointment.allergy,
        sensitivity: appointment.sensitivity,
        specialRequest: appointment.specialRequest,
        services: appointment.services,
      },
    ],
  };

  return NextResponse.json({ data: normalized }, { status: 200 });
}
