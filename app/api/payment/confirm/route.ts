import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppointmentStatus } from "@/lib/generated/lib/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, paidPrice } = await req.json();

    if (!appointmentId || !paidPrice) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.SCHEDULED,
        isPaid: true,
        finalPrice: parseFloat(paidPrice),
        paidAt: new Date(),
        confirmedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Ödeme başarıyla güncellendi" });
  } catch (err) {
    console.error("🛑 Güncelleme hatası:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
