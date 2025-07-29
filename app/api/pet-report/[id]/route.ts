import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const petId = params.id;

    const pet = await prisma.ownedPet.findFirst({
      where: {
        id: petId,
        userId: session.user.id,
      },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Evcil hayvan bulunamadı veya yetkisiz erişim" },
        { status: 404 }
      );
    }

    const reports = await prisma.petReport.findMany({
      where: {
        ownedPetId: petId,
      },
      include: {
        appointment: {
          include: {
            services: {
              include: { service: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("❌ /api/pet-reports/[id] GET hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
