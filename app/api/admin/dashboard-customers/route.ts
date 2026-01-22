import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    // Prisma client kontrolü
    if (!prisma || !prisma.order) {
      console.error("Prisma client veya order modeli bulunamadı");
      return NextResponse.json(
        {
          total: 0,
          newLast7Days: 0,
          newLast30Days: 0,
          topCustomers: [],
        },
        { status: 200 }
      );
    }

    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // Toplam müşteri sayısı
    const totalCustomers = await prisma.user.count({
      where: {
        isAdmin: false,
      },
    });

    // Son 7 günde kayıt olanlar
    const newCustomers7Days = await prisma.user.count({
      where: {
        isAdmin: false,
        createdAt: { gte: last7Days },
      },
    });

    // Son 30 günde kayıt olanlar
    const newCustomers30Days = await prisma.user.count({
      where: {
        isAdmin: false,
        createdAt: { gte: last30Days },
      },
    });

    // En çok sipariş veren müşteriler
    let topCustomers: any[] = [];
    try {
      const allCustomers = await prisma.order.groupBy({
        by: ["userId"],
        _count: {
          id: true,
        },
        _sum: {
          total: true,
        },
      });
      // Sipariş sayısına göre sırala ve ilk 5'ini al
      topCustomers = allCustomers
        .sort((a, b) => (b._count.id || 0) - (a._count.id || 0))
        .slice(0, 5);
    } catch (groupByError) {
      console.error("groupBy hatası:", groupByError);
      // Hata durumunda boş array döndür
      topCustomers = [];
    }

    if (topCustomers.length === 0) {
      return NextResponse.json({
        total: totalCustomers,
        newLast7Days: newCustomers7Days,
        newLast30Days: newCustomers30Days,
        topCustomers: [],
      });
    }

    const userIds = topCustomers.map((c) => c.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    const customersWithStats = users.map((user) => {
      const stats = topCustomers.find((c) => c.userId === user.id);
      return {
        ...user,
        orderCount: stats?._count.id || 0,
        totalSpent: stats?._sum.total || 0,
      };
    });

    return NextResponse.json({
      total: totalCustomers,
      newLast7Days: newCustomers7Days,
      newLast30Days: newCustomers30Days,
      topCustomers: customersWithStats.sort((a, b) => b.orderCount - a.orderCount),
    });
  } catch (error: any) {
    console.error("Dashboard customers error:", error);
    return NextResponse.json(
      { error: error.message || "Müşteri bilgileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
