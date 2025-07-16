import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: true,
      ownedPet: true,
      services: {
        include: { service: true },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json(appointment);
}
