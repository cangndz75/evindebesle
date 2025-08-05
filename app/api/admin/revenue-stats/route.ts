import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { eachDayOfInterval, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const start = new Date();
  start.setDate(start.getDate() - 6); // son 7 gün
  const end = new Date();

  const days = eachDayOfInterval({ start, end });

  const revenue = await prisma.appointment.findMany({
    where: {
      isPaid: true,
      confirmedAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      confirmedAt: true,
      finalPrice: true,
    },
  });

  const grouped: Record<string, number> = {};

  for (const appt of revenue) {
    if (!appt.confirmedAt || !appt.finalPrice) continue;
    const dateStr = format(new Date(appt.confirmedAt), "yyyy-MM-dd");
    grouped[dateStr] = (grouped[dateStr] || 0) + appt.finalPrice;
  }

  const data = days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return {
      date: dateStr,
      revenue: grouped[dateStr] || 0,
    };
  });

  return NextResponse.json(data);
}
