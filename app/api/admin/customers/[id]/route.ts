import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        addresses: {
          include: {
            district: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });
    }

    const totalSpent = user.orders
      .filter((o: any) => o.status !== "CANCELLED")
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    return NextResponse.json({
      id: user.id,
      name: user.name || "İsimsiz",
      email: user.email,
      phone: user.phone,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      orderCount: user.orders.length,
      totalSpent,
      orders: user.orders,
      addresses: user.addresses,
    });
  } catch (error: any) {
    console.error("Customer detail error:", error);
    return NextResponse.json(
      { error: error.message || "Müşteri detayları yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
