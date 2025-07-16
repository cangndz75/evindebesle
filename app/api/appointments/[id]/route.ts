import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } } 
) {
  try {
    const { id } = context.params;

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
  } catch (error) {
    console.error("Appointment GET error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
