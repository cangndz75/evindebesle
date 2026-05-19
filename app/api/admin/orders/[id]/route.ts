import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { notifyOrderShippedEmail } from "@/lib/services/cargo";
import { ensureInvoiceForOrder, sendInvoiceCreatedEmail } from "@/lib/services/order-post-payment";

import { iyzico, iyzicoCall, extractIyzicoItemTransactions } from "@/lib/iyzico";

type AdminOrderDetailItem = Prisma.OrderItemGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
        slug: true;
        image: true;
        primaryImage: true;
      };
    };
    color: {
      select: {
        id: true;
        name: true;
        images: true;
      };
    };
    size: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

function resolveOrderItemImage(item: AdminOrderDetailItem) {
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

async function startIyzicoCancellation(order: {
  id: string;
  total: number;
  paymentId: string | null;
  payment?: { paymentId: string | null; rawResult: any } | null;
}) {
  const ip = "127.0.0.1";
  const paymentId = order.payment?.paymentId || order.paymentId;

  if (!paymentId) {
    return {
      success: false,
      message: "Iyzico ödeme ID bulunamadı. İptal başlatılamadı.",
    };
  }

  try {
    const cancelReq = {
      locale: "tr",
      conversationId: order.id,
      paymentId,
      ip,
    };

    const cancelRes: any = await iyzicoCall<any>(
      (req, cb) => (iyzico as any).cancel.create(req, cb),
      cancelReq
    );

    if (cancelRes?.status === "success") {
      return {
        success: true,
        method: "cancel",
        raw: cancelRes,
      };
    }
  } catch (error) {
    console.error("Iyzico cancel error:", error);
  }

  const itemTransactions = extractIyzicoItemTransactions(order.payment?.rawResult);

  if (!Array.isArray(itemTransactions) || itemTransactions.length === 0) {
    return {
      success: false,
      message: "Iptal denendi ancak iade islemi icin transaction bilgisi bulunamadi.",
    };
  }

  const refundResponses: any[] = [];
  for (const tx of itemTransactions) {
    const paymentTransactionId = tx?.paymentTransactionId;
    if (!paymentTransactionId) continue;

    const txPrice = Number(tx?.paidPrice ?? tx?.price ?? 0);
    const refundReq = {
      locale: "tr",
      conversationId: order.id,
      paymentTransactionId,
      price: txPrice > 0 ? txPrice.toFixed(2) : Number(order.total).toFixed(2),
      ip,
      currency: "TRY",
    };

    const refundRes: any = await iyzicoCall<any>(
      (req, cb) => (iyzico as any).refund.create(req, cb),
      refundReq
    );

    refundResponses.push(refundRes);
    if (refundRes?.status !== "success") {
      return {
        success: false,
        message: refundRes?.errorMessage || "Iade baslatilamadi.",
        raw: refundResponses,
      };
    }
  }

  if (refundResponses.length === 0) {
    return {
      success: false,
      message: "Iade baslatmak icin uygun transaction bulunamadi.",
    };
  }

  return {
    success: true,
    method: "refund",
    raw: refundResponses,
  };
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

    const [order, auditLogs, invoice] = await Promise.all([
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
                  primaryImage: true,
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
      prisma.invoice.findFirst({
        where: { orderId: id },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
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

    const orderItems = order.items as AdminOrderDetailItem[];

    const normalizedOrder = {
      ...order,
      items: orderItems.map((item) => ({
        ...item,
        image: resolveOrderItemImage(item),
      })),
    };

    return NextResponse.json({ order: normalizedOrder, auditLogs, invoice });
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
      select: {
        id: true,
        status: true,
        adminNote: true,
        paymentStatus: true,
        total: true,
        paymentId: true,
        payment: {
          select: {
            paymentId: true,
            rawResult: true,
          },
        },
      },
    });

    if (!oldOrder) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    let cancelPaymentMeta: any = null;
    if (status === "CANCELLED") {
      if (oldOrder.status === "CANCELLED" || oldOrder.paymentStatus === "REFUNDED") {
        return NextResponse.json({ error: "Sipariş zaten iptal/iade edilmiş" }, { status: 400 });
      }

      const paymentResult = await startIyzicoCancellation({
        id: oldOrder.id,
        total: oldOrder.total,
        paymentId: oldOrder.paymentId,
        payment: oldOrder.payment,
      });

      if (!paymentResult.success) {
        return NextResponse.json(
          { error: paymentResult.message || "Iyzico iptal/iade işlemi başlatılamadı." },
          { status: 400 }
        );
      }

      cancelPaymentMeta = paymentResult;
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "CANCELLED") {
        updateData.paymentStatus = "REFUNDED";
      }
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
          newValue: {
            ...updateData,
            ...(cancelPaymentMeta ? { iyzicoCancellation: cancelPaymentMeta } : {}),
          },
          performedById: session.user.id,
        },
      }),
    ]);

    if (updateData.status === "SHIPPED" || (updatedOrder.status === "SHIPPED" && updateData.trackingNumber)) {
      const ensuredInvoice = await ensureInvoiceForOrder(updatedOrder.id).catch((err) => {
        console.error("Order shipped invoice ensure error:", err);
        return null;
      });

      if (ensuredInvoice?.created && ensuredInvoice.invoiceNumber) {
        await sendInvoiceCreatedEmail(updatedOrder.id, ensuredInvoice.invoiceNumber).catch((err) => {
          console.error("Order shipped invoice email error:", err);
        });
      }

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
