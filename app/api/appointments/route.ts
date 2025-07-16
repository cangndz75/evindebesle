import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      userPetId,
      userNote,
      allergy,
      sensitivity,
      specialRequest,
      repeatCount,
      repeatInterval,
      timeSlot,
      services, // Array<string>
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        ownedPetId: userPetId,
        userNote,
        allergy,
        sensitivity,
        specialRequest,
        repeatCount,
        repeatInterval,
        timeSlot,
        status: "SCHEDULED",
        services: {
          create: services.map((serviceId: string) => ({
            service: { connect: { id: serviceId } },
          })),
        },
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (err) {
    console.error("[APPOINTMENT_CREATE_ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
