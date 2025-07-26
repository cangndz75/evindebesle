import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppointmentStatus, MediaType } from "@/lib/generated/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;
  const {
    petId,
    completedServiceIds,
    completionDate,
    adminNote,
    media,
  } = await req.json();

  const session = await getServerSession(authConfig);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  if (
    !appointmentId ||
    !petId ||
    !completedServiceIds?.length ||
    !completionDate
  ) {
    return NextResponse.json(
      { error: "Zorunlu alanlar eksik." },
      { status: 400 }
    );
  }

  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        deliveredAt: new Date(completionDate),
        adminNote: adminNote || null,
      },
    });

    await prisma.appointmentCheck.deleteMany({
      where: {
        appointmentId,
        serviceId: { in: completedServiceIds },
      },
    });

    const checkData = completedServiceIds.map((serviceId: string) => ({
      appointmentId,
      serviceId,
      title: "Tamamlandı",
      isChecked: true,
      note: "",
    }));

    if (checkData.length > 0) {
      await prisma.appointmentCheck.createMany({ data: checkData });
    }

    if (media?.length) {
      const mediaData = media.map((m: any) => ({
        appointmentId,
        url: m.url,
        type: m.type as MediaType,
      }));
      await prisma.appointmentMedia.createMany({ data: mediaData });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Tamamlama hatası:", err);
    return NextResponse.json(
      { error: "Randevu tamamlama işlemi başarısız." },
      { status: 500 }
    );
  }
}
