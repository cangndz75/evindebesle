import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { subHours } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Yetkisiz eriÅŸim" }, { status: 403 });
    }

    if (!prisma || !prisma.order) {
      console.error("Prisma client veya order modeli bulunamadÄ±");
      return NextResponse.json(
        { error: "VeritabanÄ± baÄŸlantÄ± hatasÄ±", items: [] },
        { status: 500 }
      );
    }

    const oneHourAgo = subHours(new Date(), 1);

    const pendingOrders = await prisma.order.count({
      where: {
        status: "PAID",
        paymentStatus: "PAID",
      },
    });

    const readyToShip = await prisma.order.count({
      where: {
        status: "PREPARING",
        paymentStatus: "PAID",
      },
    });

    const paymentFailed = await prisma.order.count({
      where: {
        paymentStatus: "FAILED",
        createdAt: { gte: oneHourAgo },
      },
    });

    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        sizes: {
          some: {
            stock: { lte: 3, gt: 0 },
          },
        },
      },
      include: {
        sizes: true,
      },
    });

    const lowStockCount = lowStockProducts.length;

    const outOfStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          {
            sizes: {
              none: {
                stock: { gt: 0 },
              },
            },
          },
          {
            sizes: {
              every: {
                stock: { lte: 0 },
              },
            },
          },
        ],
      },
    });

    const outOfStockCount = outOfStockProducts.length;

    const refundRequests = await prisma.order.count({
      where: {
        status: "CANCELLED",
        paymentStatus: "PAID",
        createdAt: { gte: oneHourAgo },
      },
    });



    return NextResponse.json({
      readyToShip,
      paymentFailed,
      lowStockCount,
      refundRequests,
      items: [
        ...(pendingOrders > 0 ? [{
          type: "pending_orders",
          count: pendingOrders,
          label: `${pendingOrders} bekleyen sipariÅŸ`,
          action: "/admin-orders?status=PAID",
          priority: "high",
        }] : []),
        ...(readyToShip > 0 ? [{
          type: "ready_to_ship",
          count: readyToShip,
          label: `${readyToShip} sipariÅŸ kargoya hazÄ±r`,
          action: "/admin-orders?status=PREPARING",
          priority: "high",
        }] : []),
        ...(paymentFailed > 0 ? [{
          type: "payment_failed",
          count: paymentFailed,
          label: `${paymentFailed} Ã¶deme hatasÄ± / fraud ÅŸÃ¼phesi`,
          action: "/admin-orders?paymentStatus=FAILED",
          priority: "high",
        }] : []),
        ...(refundRequests > 0 ? [{
          type: "refund_request",
          count: refundRequests,
          label: `${refundRequests} iade talebi bekliyor`,
          action: "/admin-orders?status=CANCELLED",
          priority: "medium",
        }] : []),
        ...(outOfStockCount > 0 ? [{
          type: "out_of_stock",
          count: outOfStockCount,
          label: `${outOfStockCount} Ã¼rÃ¼n tÃ¼kendi`,
          action: "/admin-products?stockStatus=outOfStock",
          priority: "high",
        }] : []),
        ...(lowStockCount > 0 ? [{
          type: "low_stock",
          count: lowStockCount,
          label: `${lowStockCount} kritik stok`,
          action: "/admin-products?stockStatus=lowStock",
          priority: "medium",
        }] : []),

      ],
    });
  } catch (error: any) {
    console.error("Action inbox error:", error);
    return NextResponse.json(
      { error: error.message || "Action inbox yÃ¼klenirken bir hata oluÅŸtu" },
      { status: 500 }
    );
  }
}
