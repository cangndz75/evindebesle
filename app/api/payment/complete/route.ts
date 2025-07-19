import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, paidPrice } = await req.json();

    if (!appointmentId || typeof paidPrice === "undefined") {
      return NextResponse.json(
        { error: "Eksik parametre" },
        { status: 400 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.SCHEDULED,
        finalPrice: parseFloat(paidPrice),
        paidAt: new Date(),
        isPaid: true,
        confirmedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error("💥 payment/complete Hata:", error);
    return NextResponse.json(
      { success: false, error: "Randevu güncellenemedi" },
      { status: 500 }
    );
  }
}
