import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });

    // Bugünkü Ciro
    const todayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
    });

    const yesterdayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
    });

    const weekRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
    });

    const lastWeekRevenue = await prisma.order.aggregate({
      where: {
        createdAt: { gte: lastWeekStart, lte: lastWeekEnd },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
    });

    // Randevu gelirleri de ekle
    const todayAppointmentRevenue = await prisma.appointment.aggregate({
      where: {
        confirmedAt: { gte: todayStart, lte: todayEnd },
        status: "COMPLETED",
      },
      _sum: { finalPrice: true },
    });

    const weekAppointmentRevenue = await prisma.appointment.aggregate({
      where: {
        confirmedAt: { gte: weekStart, lte: weekEnd },
        status: "COMPLETED",
      },
      _sum: { finalPrice: true },
    });

    const todayTotalRevenue = (todayRevenue._sum.total || 0) + (todayAppointmentRevenue._sum.finalPrice || 0);
    const yesterdayTotalRevenue = (yesterdayRevenue._sum.total || 0);
    const weekTotalRevenue = (weekRevenue._sum.total || 0) + (weekAppointmentRevenue._sum.finalPrice || 0);
    const lastWeekTotalRevenue = (lastWeekRevenue._sum.total || 0);

    // Sipariş Adedi
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });

    const weekOrders = await prisma.order.count({
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    // AOV (Average Order Value)
    const todayOrdersWithTotal = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        paymentStatus: "PAID",
      },
      select: { total: true },
    });

    const todayAOV = todayOrdersWithTotal.length > 0
      ? todayOrdersWithTotal.reduce((sum, o) => sum + o.total, 0) / todayOrdersWithTotal.length
      : 0;

    const weekOrdersWithTotal = await prisma.order.findMany({
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
        paymentStatus: "PAID",
      },
      select: { total: true },
    });

    const weekAOV = weekOrdersWithTotal.length > 0
      ? weekOrdersWithTotal.reduce((sum, o) => sum + o.total, 0) / weekOrdersWithTotal.length
      : 0;

    // İade/İptal Oranı
    const totalOrders = await prisma.order.count({
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const cancelledOrders = await prisma.order.count({
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
        status: "CANCELLED",
      },
    });

    const refundedOrders = await prisma.order.count({
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
        paymentStatus: "REFUNDED",
      },
    });

    const cancellationRate = totalOrders > 0 ? ((cancelledOrders + refundedOrders) / totalOrders) * 100 : 0;

    // Yeni Müşteri Sayısı
    const newCustomersToday = await prisma.user.count({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        isAdmin: false,
      },
    });

    const newCustomersWeek = await prisma.user.count({
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
        isAdmin: false,
      },
    });

    // Repeat Rate (Tekrar Eden Müşteriler)
    const customersWithMultipleOrders = await prisma.order.groupBy({
      by: ["userId"],
      where: {
        createdAt: { gte: weekStart, lte: weekEnd },
      },
      _count: { id: true },
    });

    const repeatCustomers = customersWithMultipleOrders.filter(c => c._count.id > 1).length;
    const totalCustomers = await prisma.user.count({
      where: {
        isAdmin: false,
        orders: {
          some: {
            createdAt: { gte: weekStart, lte: weekEnd },
          },
        },
      },
    });

    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // Kâr Marjı (şimdilik basit hesaplama - maliyet bilgisi yoksa 0)
    // TODO: Ürün maliyet bilgisi eklendiğinde güncellenecek
    const profitMargin = 0; // Placeholder

    // Conversion Rate (şimdilik placeholder - trafik entegrasyonu yok)
    const conversionRate = 0; // Placeholder

    return NextResponse.json({
      todayRevenue: {
        total: todayTotalRevenue,
        change: yesterdayTotalRevenue > 0
          ? ((todayTotalRevenue - yesterdayTotalRevenue) / yesterdayTotalRevenue) * 100
          : 0,
        previousTotal: yesterdayTotalRevenue,
      },
      weekRevenue: {
        total: weekTotalRevenue,
        change: lastWeekTotalRevenue > 0
          ? ((weekTotalRevenue - lastWeekTotalRevenue) / lastWeekTotalRevenue) * 100
          : 0,
        previousTotal: lastWeekTotalRevenue,
      },
      todayOrders: {
        count: todayOrders,
        change: 0, // TODO: dün ile karşılaştır
      },
      weekOrders: {
        count: weekOrders,
        change: 0, // TODO: geçen hafta ile karşılaştır
      },
      aov: {
        today: todayAOV,
        week: weekAOV,
        change: 0, // TODO: karşılaştırma
      },
      cancellationRate: {
        rate: cancellationRate,
        cancelled: cancelledOrders,
        refunded: refundedOrders,
      },
      newCustomers: {
        today: newCustomersToday,
        week: newCustomersWeek,
        change: 0, // TODO: karşılaştırma
      },
      repeatRate: {
        rate: repeatRate,
        repeatCustomers,
        totalCustomers,
      },
      profitMargin: {
        rate: profitMargin,
      },
      conversionRate: {
        rate: conversionRate,
      },
    });
  } catch (error: any) {
    console.error("Dashboard KPIs error:", error);
    return NextResponse.json(
      { error: error.message || "KPI'lar yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
