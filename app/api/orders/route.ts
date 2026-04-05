
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { jsonNoStore } from "@/lib/api/policy";
import { toOrderListDTO } from "@/lib/api/dto/order";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, image: true } },
            color: { select: { id: true, name: true } },
            size: { select: { id: true, name: true } },
          },
        },
        shippingAddress: { include: { district: true } },
        billingAddress: { include: { district: true } },
        coupon: { select: { code: true, discountType: true, value: true } },
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

  const session = await getServerSession(authConfig);
  if (!session?.user?.isAdmin) {
    return jsonNoStore(
      { error: "Direct order creation is disabled. Please use the checkout flow." },
      { status: 403 }
    );
  }

  return jsonNoStore(
    { error: "Endpoint deprecated for direct calling. Use /api/checkout/initialize" },
    { status: 400 }
  );
}
