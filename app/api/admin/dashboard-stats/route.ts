import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays, subHours } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const last7DaysStart = subDays(now, 7);
    const last7DaysEnd = now;
    const previous7DaysStart = subDays(now, 14);
    const previous7DaysEnd = subDays(now, 7);
    const lastHour = subHours(now, 1);

    // Toplam Gelir (Son 7 gün vs Önceki 7 gün)
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

    // Bekleyen Siparişler
    const [pendingOrders, pendingOrdersLastHour] = await Promise.all([
      prisma.order.count({
        where: { status: "PENDING" },
      }),
      prisma.order.count({
        where: {
          status: "PENDING",
          createdAt: { gte: lastHour },
        },
      }),
    ]);

    // Bugünkü Randevular
    const [todayAppointments, yesterdayAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          confirmedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.appointment.count({
        where: {
          confirmedAt: {
            gte: startOfDay(subDays(now, 1)),
            lte: endOfDay(subDays(now, 1)),
          },
        },
      }),
    ]);

    const appointmentsChange = yesterdayAppointments > 0
      ? ((todayAppointments - yesterdayAppointments) / yesterdayAppointments) * 100
      : 0;

    const cancelledToday = await prisma.appointment.count({
      where: {
        status: "CANCELED",
        confirmedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    // Stok Alarmı
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
    const previousStockAlarmCount = stockAlarmCount - 3; // Simüle edilmiş
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
      todayAppointments: {
        count: todayAppointments,
        change: appointmentsChange,
        cancelled: cancelledToday,
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
      { error: error.message || "İstatistikler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
