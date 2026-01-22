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

    const users = await prisma.user.findMany({
      where: {
        isAdmin: false,
      },
      include: {
        orders: {
          where: {
            paymentStatus: "PAID",
          },
          select: {
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    const customers = users.map((user) => {
      const orders = user.orders;
      const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const lastOrder = orders[0];

      return {
        id: user.id,
        name: user.name || "İsimsiz",
        email: user.email,
        phone: user.phone,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        orderCount: orders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt.toISOString() || null,
      };
    });

    // LTV'ye göre sırala
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Customers fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Müşteri verileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
