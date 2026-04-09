import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const [users, products, orders, revenueResult] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "PREPARING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED"] } },
    }),
  ]);

  const revenue = revenueResult._sum?.total ?? 0;

  return NextResponse.json({
    users,
    products,
    orders,
    revenue,
  });
}
