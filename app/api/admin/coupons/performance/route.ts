import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      include: {
        orders: {
          where: {
            paymentStatus: "PAID",
          },
          select: {
            discount: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    const performance = coupons.map((coupon: any) => {
      const orders = coupon.orders;
      const totalDiscount = orders.reduce((sum: number, o: any) => sum + (o.discount || 0), 0);
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const usageCount = orders.length;

      return {
        id: coupon.id,
        code: coupon.code,
        usageCount,
        totalDiscount,
        totalRevenue,
        averageOrderValue: usageCount > 0 ? totalRevenue / usageCount : 0,
        discountCost: totalDiscount,
        revenueImpact: totalRevenue - totalDiscount,
      };
    });

    return NextResponse.json(performance);
  } catch (error: any) {
    console.error("Coupon performance error:", error);
    return NextResponse.json(
      { error: error.message || "Kupon performans verileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
