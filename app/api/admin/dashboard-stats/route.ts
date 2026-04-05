import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays, subHours } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz eriÅŸim" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const last7DaysStart = subDays(now, 7);
    const last7DaysEnd = now;
    const previous7DaysStart = subDays(now, 14);
    const previous7DaysEnd = subDays(now, 7);
    const lastHour = subHours(now, 1);

    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: last7DaysStart, lte: last7DaysEnd },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: previous7DaysStart, lte: previous7DaysEnd },
        },
      }),
    ]);

    const currentRevenueTotal = currentRevenue._sum.total || 0;
    const previousRevenueTotal = previousRevenue._sum.total || 0;
    const revenueChange = previousRevenueTotal > 0
      ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100
      : 0;

    const [pendingOrders, pendingOrdersLastHour] = await Promise.all([
      prisma.order.count({
        where: { status: "PAID" },
      }),
      prisma.order.count({
        where: {
          status: "PAID",
          createdAt: { gte: lastHour },
        },
      }),
    ]);



    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        sizes: {
          some: {
            stock: { lte: 10, gt: 0 },
          },
        },
      },
      include: {
        sizes: true,
      },
    });

    const outOfStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        sizes: {
          every: {
            stock: 0,
          },
        },
      },
      include: {
        sizes: true,
      },
    });

    const criticalStockCount = lowStockProducts.filter((p: any) => {
      const totalStock = p.sizes.reduce((sum: number, s: any) => sum + s.stock, 0);
      return totalStock <= 3;
    }).length;

    const stockAlarmCount = lowStockProducts.length + outOfStockProducts.length;
    const previousStockAlarmCount = stockAlarmCount - 3; // SimÃ¼le edilmiÅŸ
    const stockChange = previousStockAlarmCount > 0
      ? ((stockAlarmCount - previousStockAlarmCount) / previousStockAlarmCount) * 100
      : 0;

    return NextResponse.json({
      revenue: {
        total: currentRevenueTotal,
        change: revenueChange,
        previousTotal: previousRevenueTotal,
      },
      pendingOrders: {
        count: pendingOrders,
        newLastHour: pendingOrdersLastHour,
      },

      stockAlarm: {
        count: stockAlarmCount,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        critical: criticalStockCount,
        change: stockChange,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Ä°statistikler yÃ¼klenirken bir hata oluÅŸtu." },
      { status: 500 }
    );
  }
}
