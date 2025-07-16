import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

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
    return new Response(JSON.stringify({ error: "Bulunamadı" }), {
      status: 404,
    });
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

  return new Response(JSON.stringify({ data: normalized }), {
    status: 200,
  });
}
