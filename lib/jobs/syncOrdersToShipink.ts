import { prisma } from "@/lib/db";
import {
  getShipinkToken,
  createShipinkOrder,
  createOutgoingShipment,
} from "@/lib/shipinkService";
import { formatShipinkFetchError, getShipinkApiBaseUrl } from "@/lib/shipinkApiBase";
import { buildShipinkCustomerBlock } from "@/lib/shipink-customer-address";
import { sendTelegramMessage } from "@/lib/telegramService";

const BATCH_SIZE = 20;

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
  return {
    customer: buildShipinkCustomerBlock({
      user: order.user,
      shippingAddress: order.shippingAddress,
    }),
    items: order.items.map((item: { productName?: string | null; quantity: number; unitPrice?: number | null }) => ({
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
  {
    dimension_unit: "cm",
    height: 10,
    length: 30,
    width: 25,
    weight: 1,
    weight_unit: "kg",
  },
];

type ShipinkPushSource = "cron" | "post_payment";

async function syncSingleOrder(
  order: SyncableOrder,
  token: string,
  source: ShipinkPushSource = "cron",
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

  const providerLabel = source === "post_payment" ? "shipink_post_payment" : "shipink_cron";

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
          provider: providerLabel,
          source,
        },
      },
    }),
  ]);

  return { success: true };
}

function isShipinkCredentialsConfigured(): boolean {
  return !!(process.env.SHIPINK_EMAIL?.trim() && process.env.SHIPINK_PASSWORD?.trim());
}

/**
 * Ödeme sonrası (veya tekrar gelen callback) tek siparişi Shipink'e iter.
 * Cron ile çakışmaz: shipinkOrderId doluysa veya PAID değilse no-op.
 * Hata durumunda sadece log; ödeme akışı etkilenmez. Cron sonradan tekrar dener.
 */
export async function tryPushPaidOrderToShipink(orderId: string): Promise<void> {
  if (!isShipinkCredentialsConfigured()) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      shippingAddress: { include: { district: true } },
    },
  });

  if (!order || order.deletedAt) return;
  if (order.status !== "PAID" || order.shipinkOrderId) return;

  try {
    const token = await getShipinkToken();
    await syncSingleOrder(order as SyncableOrder, token, "post_payment");
  } catch (err: unknown) {
    console.error(
      `[SHIPINK_PUSH_PAID] ${order.orderNumber} (${orderId}):`,
      formatShipinkFetchError(err, `base=${getShipinkApiBaseUrl()}`),
    );
  }
}

export type ShipinkSyncResult = {
  synced: number;
  failed: number;
  duration: number;
  results: Array<{ orderId: string; orderNumber: string; success: boolean; error?: string }>;
  message?: string;
};

export async function runShipinkOrderSync(): Promise<ShipinkSyncResult> {
  const start = Date.now();
  const results: ShipinkSyncResult["results"] = [];

  const orders = await fetchPendingOrders();

  if (orders.length === 0) {
    return { synced: 0, failed: 0, duration: Date.now() - start, results, message: "Bekleyen sipariş yok." };
  }

  const token = await getShipinkToken();

  for (const order of orders) {
    try {
      const result = await syncSingleOrder(order, token, "cron");
      results.push({ orderId: order.id, orderNumber: order.orderNumber, ...result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SYNC_ORDERS_SHIPINK] ${order.orderNumber} hata:`, message);
      results.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        success: false,
        error: message,
      });
    }
  }

  const synced = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  if (synced > 0) {
    sendTelegramMessage(
      `📦 <b>Shipink Cron: ${synced} sipariş senkronize edildi</b>${failed > 0 ? `\n⚠️ ${failed} sipariş başarısız` : ""}`,
    ).catch(() => {});
  }

  return { synced, failed, duration: Date.now() - start, results };
}
