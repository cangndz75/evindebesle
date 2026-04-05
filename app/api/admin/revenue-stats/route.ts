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
  start.setDate(start.getDate() - 6); // son 7 gÃ¼n
  const end = new Date();

  const days = eachDayOfInterval({ start, end });

  const orderRevenue = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
  });

  const revenue = orderRevenue.map((r: any) => ({
    date: r.createdAt,
    amount: r.total || 0,
  }));

  const grouped: Record<string, number> = {};

  for (const item of revenue) {
    if (!item.date || !item.amount) continue;
    const dateStr = format(new Date(item.date), "yyyy-MM-dd");
    grouped[dateStr] = (grouped[dateStr] || 0) + item.amount;
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
