import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const risk = searchParams.get("risk");
    if (risk === "high") {
      where.riskScore = { gte: 50 };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            color: {
              select: {
                id: true,
                name: true,
              },
            },
            size: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        shippingAddress: {
          include: {
            district: true,
          },
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            value: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // İlk 100 sipariş
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Siparişler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
