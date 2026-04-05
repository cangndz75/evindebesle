import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30days";

    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "7days":
        startDate = subDays(now, 7);
        break;
      case "90days":
        startDate = subDays(now, 90);
        break;
      case "1year":
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startDate },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const revenueByDate: Record<string, number> = {};
    const ordersByDate: Record<string, number> = {};

    orders.forEach((order: any) => {
      const dateKey = format(new Date(order.createdAt), "yyyy-MM-dd");
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + order.total;
      ordersByDate[dateKey] = (ordersByDate[dateKey] || 0) + 1;
    });

    const revenue = Object.entries(revenueByDate)
      .map(([date, revenue]: [string, number]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const ordersData = Object.entries(ordersByDate)
      .map(([date, orders]: [string, number]) => ({ date, orders }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const categoryRevenue: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const categoryName = item.product.category?.name || "Kategori Yok";
        if (!categoryRevenue[categoryName]) {
          categoryRevenue[categoryName] = { revenue: 0, orders: 0 };
        }
        categoryRevenue[categoryName].revenue += item.totalPrice;
        categoryRevenue[categoryName].orders += 1;
      });
    });

    const categories = Object.entries(categoryRevenue).map(([name, data]: [string, any]) => ({
      name,
      revenue: data.revenue,
      orders: data.orders,
    }));

    const productRevenue: Record<string, { revenue: number; orders: number }> = {};
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const productName = item.product.name;
        if (!productRevenue[productName]) {
          productRevenue[productName] = { revenue: 0, orders: 0 };
        }
        productRevenue[productName].revenue += item.totalPrice;
        productRevenue[productName].orders += item.quantity;
      });
    });

    const products = Object.entries(productRevenue)
      .map(([name, data]: [string, any]) => ({
        name,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const cancelledOrders = await prisma.order.count({
      where: {
        status: "CANCELLED",
        createdAt: { gte: startDate },
      },
    });

    const returnRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return NextResponse.json({
      revenue,
      orders: ordersData,
      categories,
      products,
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        returnRate,
      },
    });
  } catch (error: any) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: "Rapor verileri yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
