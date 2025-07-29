import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const petId = searchParams.get("petId");

  if (!petId) {
    return NextResponse.json({ error: "Pet ID gerekli" }, { status: 400 });
  }

  try {
    const pet = await prisma.ownedPet.findUnique({
      where: { id: petId },
      include: { pet: true },
    });

    if (!pet) {
      return NextResponse.json({ error: "Pet bulunamadı" }, { status: 404 });
    }

    const petReports = await prisma.petReport.findMany({
      where: { ownedPetId: petId },
      orderBy: { createdAt: "desc" },
    });

    const reports = await Promise.all(
      petReports.map(async (pr) => {
        try {
          const appointmentId = pr.appointmentId;

          const appointment = appointmentId
            ? await prisma.appointment.findUnique({
                where: { id: appointmentId },
                select: { confirmedAt: true },
              })
            : null;

          const services = appointmentId
            ? await prisma.appointmentService.findMany({
                where: { appointmentId },
                include: { service: { select: { name: true } } },
              })
            : [];

          const medias = appointmentId
            ? await prisma.appointmentMedia.findMany({
                where: { appointmentId },
                select: { id: true, url: true },
              })
            : [];

          return {
            petReport: {
              id: pr.id,
              mood: pr.mood,
              behavior: pr.behavior,
              mealTime: pr.mealTime,
              waterIntake: pr.waterIntake,
              sleepStatus: pr.sleepStatus,
              walkTime: pr.walkTime,
              toiletInfo: pr.toiletInfo,
              comments: pr.comments,
              appointmentDate: appointment?.confirmedAt ?? pr.createdAt,
            },
            appointmentServices: services,
            medias,
            appointmentDate: appointment?.confirmedAt ?? pr.createdAt,
          };
        } catch (err) {
          console.warn("Rapor hazırlanırken hata:", err);
          return {
            petReport: {
              id: pr.id,
              mood: pr.mood,
              behavior: pr.behavior,
              mealTime: pr.mealTime,
              waterIntake: pr.waterIntake,
              sleepStatus: pr.sleepStatus,
              walkTime: pr.walkTime,
              toiletInfo: pr.toiletInfo,
              comments: pr.comments,
              appointmentDate: pr.createdAt,
            },
            appointmentServices: [],
            medias: [],
            appointmentDate: pr.createdAt,
          };
        }
      })
    );

    return NextResponse.json({
      pet,
      reports,
    });
  } catch (error) {
    console.error("Pet report fetch error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}