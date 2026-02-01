
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

// GENERIC ORDER FETCH
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Siparişler yüklenirken hata" }, { status: 500 });
  }
}

// POST DISABLE/RESTRICTION
export async function POST(request: NextRequest) {
  // 🚨 SECURITY: Direct Order Creation is disabled to enforce Stock Reservation flow via /checkout/initialize
  // Only Admin or special internal calls might be allowed, but for now we block public access.

  const session = await getServerSession(authConfig);
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: "Direct order creation is disabled. Please use the checkout flow." },
      { status: 403 }
    );
  }

  // If admin really needs to create order, they should probably go through a similar flow or we implement reserveStockTx here too.
  // For now, returning 403 is the safest fix for the High Risk issue.
  return NextResponse.json(
    { error: "Endpoint deprecated for direct calling. Use /api/checkout/initialize" },
    { status: 400 }
  );
}
