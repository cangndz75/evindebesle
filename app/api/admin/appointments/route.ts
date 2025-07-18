import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const appointments = await prisma.appointment.findMany({
      orderBy: { confirmedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pets: {
          include: {
            ownedPet: {
              select: {
                name: true,
                image: true,
                pet: {
                  select: {
                    species: true,
                  },
                },
              },
            },
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: appointments }, { status: 200 });
  } catch (error) {
    console.error("Admin randevu listesi hatası:", error);
    return NextResponse.json(
      { success: false, message: "Veriler alınamadı." },
      { status: 500 }
    );
  }
}
