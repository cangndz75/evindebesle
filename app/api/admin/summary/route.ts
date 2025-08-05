import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const [users, pets, appointments, revenueResult] = await Promise.all([
    prisma.user.count(),
    prisma.ownedPet.count(),
    prisma.appointment.count(),
    prisma.appointment.aggregate({
      _sum: { finalPrice: true },
      where: { isPaid: true },
    }),
  ]);

  const revenue = revenueResult._sum?.finalPrice ?? 0;

  return NextResponse.json({
    users,
    pets,
    appointments,
    revenue,
  });
}
