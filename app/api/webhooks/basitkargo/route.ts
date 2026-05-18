import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegramService";

const BK_STATUS_MAP: Record<string, string> = {
  NEW: "PENDING",
  READY_TO_SHIP: "SHIPPED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "SHIPPED",
  COMPLETED: "COMPLETED",
  RETURNING: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
};

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const barcode = payload.barcode;
    const bkStatus = payload.status;
    const handlerName = payload.handler?.name || payload.shipmentInfo?.handler?.name || "";
    const handlerShipmentCode = payload.handlerShipmentCode || payload.shipmentInfo?.handlerShipmentCode || "";

    if (!barcode || !bkStatus) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingNumber: barcode },
          { trackingNumber: handlerShipmentCode || undefined },
          { shipinkOrderId: payload.id || undefined },
        ],
      },
    });

    if (!order) {
      return NextResponse.json({ ignored: true, reason: "ORDER_NOT_FOUND" });
    }

    const mappedStatus = BK_STATUS_MAP[bkStatus];
    if (!mappedStatus) {
      return NextResponse.json({ ignored: true, reason: "UNKNOWN_STATUS", bkStatus });
    }

    if (mappedStatus === "COMPLETED" && order.status !== "COMPLETED") {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            deliveredAt: new Date(),
          },
        }),
        prisma.auditLog.create({
          data: {
            entityId: order.id,
            entityType: "ORDER",
            action: "BASITKARGO_WEBHOOK_DELIVERED",
            newValue: {
              status: "COMPLETED",
              bkStatus,
              barcode,
              handlerName,
            },
          },
        }),
      ]);

      sendTelegramMessage(
        `📦 <b>Sipariş Teslim Edildi</b>\n\n📋 <b>Sipariş:</b> <code>${order.orderNumber}</code>\n🚚 <b>Kargo:</b> ${handlerName || "BasitKargo"}\n✅ Durum otomatik COMPLETED olarak güncellendi.`
      ).catch(() => {});

      return NextResponse.json({ success: true, orderId: order.id, status: "COMPLETED" });
    }

    if (mappedStatus === "SHIPPED" && order.status !== "SHIPPED" && order.status !== "COMPLETED") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "SHIPPED",
          shippedAt: order.shippedAt || new Date(),
          trackingNumber: handlerShipmentCode || order.trackingNumber,
        },
      });

      return NextResponse.json({ success: true, orderId: order.id, status: "SHIPPED" });
    }

    return NextResponse.json({ ignored: true, orderId: order.id, currentStatus: order.status, bkStatus });
  } catch (error: any) {
    console.error("[BASITKARGO_WEBHOOK]", error);
    return NextResponse.json({ error: "WEBHOOK_EXCEPTION" }, { status: 500 });
  }
}
