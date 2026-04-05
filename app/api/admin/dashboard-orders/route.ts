import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        items: {
          take: 1,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    const ordersWithTime = orders.map((order: any) => {
      const createdAt = new Date(order.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      let timeAgo = "";
      if (diffHours > 0) {
        timeAgo = `${diffHours} saat önce`;
      } else if (diffMinutes > 0) {
        timeAgo = `${diffMinutes} dakika önce`;
      } else {
        timeAgo = "Az önce";
      }

      return {
        ...order,
        timeAgo,
      };
    });

    return NextResponse.json(ordersWithTime);
  } catch (error: any) {
    console.error("Dashboard orders error:", error);
    return NextResponse.json(
      { error: error.message || "Siparişler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
