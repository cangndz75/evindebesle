import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { notifyOrderShippedEmail } from "@/lib/services/cargo";

function resolveOrderItemImage(item: any) {
  if (item.image) return item.image;

  const rawColorImages = item.color?.images;
  if (rawColorImages) {
    try {
      const parsed = typeof rawColorImages === "string" ? JSON.parse(rawColorImages) : rawColorImages;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0] ?? null;
      }
      if (typeof parsed === "string" && parsed.trim()) {
        return parsed;
      }
    } catch {
      if (typeof rawColorImages === "string" && rawColorImages.trim()) {
        return rawColorImages;
      }
    }
  }

  return item.product?.primaryImage ?? item.product?.image ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [order, auditLogs] = await Promise.all([
      prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  image: true,
                },
              },
              color: {
                select: {
                  id: true,
                  name: true,
                  images: true,
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
          cargoCompany: true,
          billingAddress: {
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
      }),
      prisma.auditLog.findMany({
        where: {
          entityId: id,
          entityType: "ORDER",
        },
        include: {
          performedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    if (!order) {
      return NextResponse.json(
        { error: "Sipariş bulunamadı" },
        { status: 404 }
      );
    }

    const normalizedOrder = {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        image: resolveOrderItemImage(item),
      })),
    };

    return NextResponse.json({ order: normalizedOrder, auditLogs });
  } catch (error: any) {
    console.error("Order detail fetch error:", error);
    return NextResponse.json(
      { error: "Sipariş detayı yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber, adminNote, cargoCompanyId } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const oldOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true, adminNote: true },
    });

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "SHIPPED") {
        updateData.shippedAt = new Date();
      } else if (status === "DELIVERED" || status === "COMPLETED") {
        updateData.deliveredAt = new Date();
      }
    }
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }
    if (cargoCompanyId !== undefined) {
      updateData.cargoCompanyId = cargoCompanyId;
    }
    if (adminNote !== undefined) {
      updateData.adminNote = adminNote;
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: updateData,
      }),
      prisma.auditLog.create({
        data: {
          entityId: id,
          entityType: "ORDER",
          action: "UPDATE",
          oldValue: oldOrder ? (oldOrder as any) : {},
          newValue: updateData,
          performedById: session.user.id,
        },
      }),
    ]);

    if (updateData.status === "SHIPPED" || (updatedOrder.status === "SHIPPED" && updateData.trackingNumber)) {
      await notifyOrderShippedEmail(updatedOrder.id).catch((err) => {
        console.error("Order shipped email error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Sipariş güncellenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
