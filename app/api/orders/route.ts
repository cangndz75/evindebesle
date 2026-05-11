
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { jsonNoStore } from "@/lib/api/policy";
import { toOrderListDTO } from "@/lib/api/dto/order";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    const userId = typeof token?.sub === "string" ? token.sub : null;
    if (!userId) {
      return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, image: true, primaryImage: true } },
            color: { select: { id: true, name: true, images: true } },
            size: { select: { id: true, name: true } },
          },
        },
        shippingAddress: { include: { district: true } },
        billingAddress: { include: { district: true } },
        coupon: { select: { code: true, discountType: true, value: true } },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonNoStore(orders.map(toOrderListDTO));
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return jsonNoStore({ error: "ORDERS_FETCH_EXCEPTION" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.isAdmin) {
      return jsonNoStore(
        { error: "Direct order creation is disabled. Please use the checkout flow." },
        { status: 403 }
      );
    }

    return jsonNoStore(
      { error: "Endpoint deprecated for direct calling. Use /api/checkout/initialize" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Orders POST auth error:", error);
    return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
  }
}
