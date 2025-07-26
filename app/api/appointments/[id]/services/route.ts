import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;

  if (!appointmentId) {
    return NextResponse.json({ error: "Randevu ID eksik." }, { status: 400 });
  }

  try {
    const services = await prisma.appointmentService.findMany({
      where: { appointmentId },
      include: {
        service: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });

    const formatted = services.map((s) => ({
      serviceId: s.serviceId,
      name: s.service.name,
      description: s.service.description,
      isCompleted: s.isCompleted,
      completedAt: s.completedAt,
    }));

    return NextResponse.json({ services: formatted });
  } catch (error) {
    console.error("🚨 Hata:", error);
    return NextResponse.json(
      { error: "Hizmetler getirilirken hata oluştu." },
      { status: 500 }
    );
  }
}
