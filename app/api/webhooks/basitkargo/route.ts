import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
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

/** Webhook satırındaki token; yoksa API token ile doğrulanır (Basit Kargo paneli genelde aynı değeri kullanır). */
function getExpectedWebhookSecret(): string | null {
  const webhook = process.env.BASITKARGO_WEBHOOK_TOKEN?.trim();
  const api = process.env.BASITKARGO_API_TOKEN?.trim();
  return webhook || api || null;
}

function extractBearerOrRaw(header: string | null): string | null {
  if (!header) return null;
  const h = header.trim();
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  return h;
}

function safeEqualToken(received: string, expected: string): boolean {
  try {
    const a = Buffer.from(received, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Basit Kargo panelinden gelen istekleri doğrular (Authorization, Authorization-Token, X-Webhook-Token). */
function verifyBasitKargoWebhook(req: NextRequest): boolean {
  const expected = getExpectedWebhookSecret();
  if (!expected) {
    console.warn(
      "[BASITKARGO_WEBHOOK] BASITKARGO_WEBHOOK_TOKEN veya BASITKARGO_API_TOKEN tanımlı değil; istek reddedildi."
    );
    return false;
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const authTokenHeader =
    req.headers.get("authorization-token") ||
    req.headers.get("Authorization-Token") ||
    req.headers.get("Authorization-token");
  const xWebhook = req.headers.get("x-webhook-token");

  const candidates = [
    extractBearerOrRaw(authHeader),
    authTokenHeader?.trim() || null,
    xWebhook?.trim() || null,
  ].filter((x): x is string => Boolean(x && x.length > 0));

  for (const token of candidates) {
    if (safeEqualToken(token, expected)) return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyBasitKargoWebhook(req)) {
      console.warn("[WEBHOOK_AUTH_FAILED] Yetkisiz Basit Kargo webhook isteği engellendi.");
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const payload = await req.json();

    const barcode = payload.barcode;
    const bkStatus = payload.status;
    const handlerName = payload.handler?.name || payload.shipmentInfo?.handler?.name || "";
    const handlerShipmentCode = payload.handlerShipmentCode || payload.shipmentInfo?.handlerShipmentCode || "";

    if (!barcode || !bkStatus) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const orConditions: Array<Record<string, string>> = [{ trackingNumber: barcode }];
    if (handlerShipmentCode && handlerShipmentCode !== barcode) {
      orConditions.push({ trackingNumber: handlerShipmentCode });
    }
    if (payload.id && typeof payload.id === "string") {
      orConditions.push({ shipinkOrderId: payload.id });
    }

    const order = await prisma.order.findFirst({
      where: { OR: orConditions },
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
