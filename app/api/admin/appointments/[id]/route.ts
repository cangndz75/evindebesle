import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: true,
      address: {
        include: {
          district: true,
        },
      },
      ownedPet: {
        include: {
          pet: true,
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

  return new Response(JSON.stringify({ data: appointment }), {
    status: 200,
  });
}
