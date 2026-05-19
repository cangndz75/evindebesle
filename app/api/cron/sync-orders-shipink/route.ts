import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShipinkToken, createShipinkOrder, createOutgoingShipment } from "@/lib/shipinkService";
import { sendTelegramMessage } from "@/lib/telegramService";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = (process.env.CRON_SECRET || "").trim();
const BATCH_SIZE = 20;

function verifyCronAuth(req: NextRequest): boolean {
  if (!CRON_SECRET) return true;
  const auth =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    new URL(req.url).searchParams.get("secret")?.trim() ||
    "";
  return auth === CRON_SECRET;
}

type SyncableOrder = Awaited<ReturnType<typeof fetchPendingOrders>>[number];

async function fetchPendingOrders() {
  return prisma.order.findMany({
    where: {
      status: "PAID",
      shipinkOrderId: null,
      deletedAt: null,
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      shippingAddress: { include: { district: true } },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });
}

function buildShipinkOrderPayload(order: SyncableOrder) {
  const addr = order.shippingAddress as any;
  return {
    customer: {
      name: order.user?.name || "Müşteri",
      email: { main: order.user?.email || "", work: "" },
      phone: { main: order.user?.phone || "", work: "", cell: "", code: "" },
      address: {
        street: addr?.fullAddress || "",
        city: addr?.district?.city || "",
        state: addr?.district?.city || "",
        zip: addr?.postalCode || "",
        country_code: "TR",
      },
    },
    items: order.items.map((item: any) => ({
      name: item.productName || "Ürün",
      quantity: item.quantity,
      price: Number(item.unitPrice ?? 0),
      category: "clothing",
    })),
    currency: "TRY",
    price: Number(order.total),
    payment: { method: "credit-card", status: "completed" },
  };
}

const DEFAULT_PACKAGE = [
  { dimension_unit: "cm", height: 10, length: 30, width: 25, weight: 1, weight_unit: "kg" },
];

async function syncSingleOrder(
  order: SyncableOrder,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const fresh = await prisma.order.findUnique({
    where: { id: order.id },
    select: { shipinkOrderId: true, status: true },
  });

  if (fresh?.shipinkOrderId || fresh?.status !== "PAID") {
    return { success: true };
  }

  const shipinkOrderId = await createShipinkOrder(token, buildShipinkOrderPayload(order));

  const shipmentResult = await createOutgoingShipment(token, shipinkOrderId, DEFAULT_PACKAGE);

  const trackingNumber =
    shipmentResult?.carrier?.shipment_id ||
    shipmentResult?.tracking_number ||
    shipmentResult?.trackingNumber ||
    null;
  const cargoPdfUrl = shipmentResult?.document?.labels?.[0]?.pdf || null;
  const cargoTrackingUrl = shipmentResult?.tracking?.url || null;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PREPARING",
        shipinkOrderId,
        trackingNumber,
        cargoPdfUrl,
        cargoTrackingUrl,
      },
    }),
    prisma.auditLog.create({
      data: {
        entityId: order.id,
        entityType: "ORDER",
        action: "SHIPINK_CRON_SYNCED",
        newValue: {
          shipinkOrderId,
          trackingNumber,
          provider: "shipink_cron",
        },
      },
    }),
  ]);

  return { success: true };
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const start = Date.now();
  const results: Array<{ orderId: string; orderNumber: string; success: boolean; error?: string }> = [];

  try {
    const orders = await fetchPendingOrders();

    if (orders.length === 0) {
      return NextResponse.json({ synced: 0, message: "Bekleyen sipariş yok." });
    }

    const token = await getShipinkToken();

    for (const order of orders) {
      try {
        const result = await syncSingleOrder(order, token);
        results.push({ orderId: order.id, orderNumber: order.orderNumber, ...result });
      } catch (err: any) {
        console.error(`[SYNC_ORDERS_SHIPINK] ${order.orderNumber} hata:`, err.message);
        results.push({ orderId: order.id, orderNumber: order.orderNumber, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      sendTelegramMessage(
        `📦 <b>Shipink Cron: ${successCount} sipariş senkronize edildi</b>${failCount > 0 ? `\n⚠️ ${failCount} sipariş başarısız` : ""}`
      ).catch(() => {});
    }

    return NextResponse.json({
      synced: successCount,
      failed: failCount,
      duration: Date.now() - start,
      results,
    });
  } catch (error: any) {
    console.error("[SYNC_ORDERS_SHIPINK] Genel hata:", error);
    return NextResponse.json({ error: error.message || "SYNC_EXCEPTION" }, { status: 500 });
  }
}
