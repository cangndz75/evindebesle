import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const appointments = await prisma.appointment.findMany({
    take: 10,
    orderBy: { confirmedAt: "desc" },
    include: {
      pets: {
        include: {
          ownedPet: true,
        },
        take: 1,
      },
      services: {
        include: {
          service: true,
        },
        take: 1,
      },
    },
  });

  const result = appointments.map((a) => ({
    id: a.id,
    petName: a.pets[0]?.ownedPet?.name || "Evcil Hayvan",
    serviceName: a.services[0]?.service.name || "Hizmet",
    time: a.confirmedAt?.toLocaleString("tr-TR") || "-",
    status: a.status,
  }));

  return NextResponse.json(result);
}
