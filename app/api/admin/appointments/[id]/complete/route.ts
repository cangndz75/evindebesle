import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { AppointmentStatus, MediaType } from "@/lib/generated/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;
  const session = await getServerSession(authConfig);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const {
    petId,
    completedServiceIds,
    completionDate,
    adminNote,
    media,
  } = await req.json();

  if (
    !appointmentId ||
    !petId ||
    !completionDate ||
    !completedServiceIds?.length
  ) {
    return NextResponse.json(
      { error: "Zorunlu alanlar eksik." },
      { status: 400 }
    );
  }

  try {
    // 1. Randevuyu güncelle
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        deliveredAt: new Date(completionDate),
        adminNote: adminNote || null,
      },
    });

    // 2. Eski hizmet check kayıtlarını sil
    await prisma.appointmentCheck.deleteMany({
      where: { appointmentId },
    });

    // 3. Yeni check kayıtlarını oluştur
    const checkData = completedServiceIds.map((serviceId: string) => ({
      appointmentId,
      serviceId,
      title: "Hizmet tamamlandı",
      isChecked: true,
    }));
    await prisma.appointmentCheck.createMany({ data: checkData });

    // 4. Medya varsa kaydet
    if (Array.isArray(media) && media.length > 0) {
      const mediaData = media.map((m: any) => ({
        appointmentId,
        url: m.url,
        type: m.type as MediaType,
      }));
      await prisma.appointmentMedia.createMany({ data: mediaData });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Randevu tamamlama hatası:", err);
    return NextResponse.json(
      { error: "Randevu tamamlama başarısız." },
      { status: 500 }
    );
  }
}
