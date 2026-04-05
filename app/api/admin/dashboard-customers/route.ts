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

    const totalCustomers = await prisma.user.count({
      where: {
        isAdmin: false,
      },
    });

    const newCustomers7Days = await prisma.user.count({
      where: {
        isAdmin: false,
        createdAt: { gte: last7Days },
      },
    });

    const newCustomers30Days = await prisma.user.count({
      where: {
        isAdmin: false,
        createdAt: { gte: last30Days },
      },
    });

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
      topCustomers = allCustomers
        .sort((a: any, b: any) => (b._count.id || 0) - (a._count.id || 0))
        .slice(0, 5);
    } catch (groupByError) {
      console.error("groupBy hatası:", groupByError);
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

    const userIds = topCustomers.map((c: any) => c.userId);
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

    const customersWithStats = users.map((user: any) => {
      const stats = topCustomers.find((c: any) => c.userId === user.id);
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
      topCustomers: customersWithStats.sort((a: any, b: any) => b.orderCount - a.orderCount),
    });
  } catch (error: any) {
    console.error("Dashboard customers error:", error);
    return NextResponse.json(
      { error: error.message || "Müşteri bilgileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
