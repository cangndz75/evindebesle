import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { canTransitionToCompletedFrom } from "@/lib/services/cargo-state";
import { getShipinkToken, createShipinkOrder, createOutgoingShipment } from "@/lib/shipinkService";
import { buildShipinkCustomerBlock } from "@/lib/shipink-customer-address";
import {
  isBasitKargoConfigured,
  createOrderWithBarcode,
  getLabelSvg,
  type BasitKargoOrderPayload,
} from "@/lib/basitkargoService";

type CreateShipmentResult = {
  trackingNumber: string;
  trackingUrl: string;
  cargoCompanyId: number;
  cargoCompanyName: string;
};

type CargoWebhookPayload = {
  tracking_number?: string;
  trackingNumber?: string;
  order_id?: string;
  orderId?: string;
  status?: string;
  cargo_status?: string;
};

function normalizeCargoStatus(status: string | undefined): string {
  return String(status || "").trim().toLowerCase();
}

function buildTrackingUrl(template: string | null | undefined, trackingNumber: string): string {
  if (!template) return trackingNumber;
  return template.replace("{trackingNumber}", encodeURIComponent(trackingNumber));
}

function randomTrackingNumber(prefix: string): string {
  const ts = Date.now().toString().slice(-8);
  const rnd = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `${prefix.toUpperCase()}${ts}${rnd}`;
}

async function sendShipmentEmail(params: {
  to: string;
  orderNumber: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  cargoCompanyName: string;
}) {
  const from = process.env.ORDER_MAIL_FROM || "siparis@dark-velvet.com";
  await resend.emails.send({
    from,
    to: params.to,
    subject: `Siparişiniz kargoya verildi: ${params.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Siparişiniz kargoya verildi</h2>
        <p>Sipariş No: <strong>${params.orderNumber}</strong></p>
        <p>Taşıyıcı: <strong>${params.cargoCompanyName}</strong></p>
        ${params.trackingNumber ? `<p>Takip Numarası: <strong>${params.trackingNumber}</strong></p>` : ""}
        ${params.trackingUrl ? `<p><a href="${params.trackingUrl}" target="_blank" rel="noopener noreferrer">Kargonuzu takip edin</a></p>` : ""}
      </div>
    `,
  });
}

async function requestExternalCargoLabel(input: {
  orderNumber: string;
  cargoCompanyCode: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  recipientAddress: string;
}): Promise<{ trackingNumber: string; trackingUrl?: string }> {
  const baseUrl = process.env.CARGO_API_BASE_URL;
  const token = process.env.CARGO_API_TOKEN;

  if (!baseUrl || !token) {
    return {
      trackingNumber: randomTrackingNumber(input.cargoCompanyCode),
    };
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/shipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderNumber: input.orderNumber,
      cargoCompanyCode: input.cargoCompanyCode,
      recipient: {
        name: input.recipientName,
        phone: input.recipientPhone,
        email: input.recipientEmail,
        address: input.recipientAddress,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "CARGO_API_ERROR");
  }

  const data = await res.json();
  const trackingNumber = data.tracking_number || data.trackingNumber;
  if (!trackingNumber) {
    throw new Error("CARGO_TRACKING_NUMBER_MISSING");
  }

  return {
    trackingNumber,
    trackingUrl: data.tracking_url || data.trackingUrl,
  };
}

type ShipmentCreateResult = CreateShipmentResult & {
  pdfUrl?: string | null;
  labelSvgUrl?: string | null;
  provider?: "basitkargo" | "shipink" | "legacy";
};

function isShipinkConfigured(): boolean {
  return !!(process.env.SHIPINK_EMAIL && process.env.SHIPINK_PASSWORD);
}

/** shipink | basitkargo | boş (varsayılan: önce BasitKargo) */
function activeCargoProviderPreference(): "shipink" | "basitkargo" | "auto" {
  const v = (process.env.ACTIVE_CARGO_PROVIDER || "").trim().toLowerCase();
  if (v === "shipink") return "shipink";
  if (v === "basitkargo") return "basitkargo";
  return "auto";
}

export async function createShipmentLabelForOrder(params: {
  orderId: string;
  cargoCompanyCode?: string;
  handlerCode?: string;
  performedById?: string;
}): Promise<ShipmentCreateResult> {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      items: true,
      shippingAddress: {
        include: {
          district: true,
        },
      },
      cargoCompany: true,
    },
  });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  const cargoCompany = await prisma.cargoCompany.findFirst({
    where: {
      isActive: true,
      ...(params.cargoCompanyCode ? { code: params.cargoCompanyCode } : { code: "aras" }),
    },
  });

  if (!cargoCompany) {
    throw new Error("CARGO_COMPANY_NOT_FOUND");
  }

  if (order.trackingNumber) {
    return {
      trackingNumber: order.trackingNumber,
      trackingUrl: buildTrackingUrl(
        order.cargoCompany?.trackingUrl || cargoCompany.trackingUrl,
        order.trackingNumber
      ),
      cargoCompanyId: order.cargoCompanyId || cargoCompany.id,
      cargoCompanyName: order.cargoCompany?.name || cargoCompany.name,
      pdfUrl: (order as any).cargoPdfUrl || null,
    };
  }

  const cargoPref = activeCargoProviderPreference();

  if (cargoPref === "shipink") {
    if (isShipinkConfigured()) {
      return createShipmentViaShipink(order, cargoCompany, params.performedById);
    }
    if (isBasitKargoConfigured()) {
      return createShipmentViaBasitKargo(order, cargoCompany, params.handlerCode, params.performedById);
    }
    return createShipmentViaLegacy(order, cargoCompany, params.performedById);
  }

  if (cargoPref === "basitkargo") {
    if (isBasitKargoConfigured()) {
      return createShipmentViaBasitKargo(order, cargoCompany, params.handlerCode, params.performedById);
    }
    if (isShipinkConfigured()) {
      return createShipmentViaShipink(order, cargoCompany, params.performedById);
    }
    return createShipmentViaLegacy(order, cargoCompany, params.performedById);
  }

  if (isBasitKargoConfigured()) {
    return createShipmentViaBasitKargo(order, cargoCompany, params.handlerCode, params.performedById);
  }

  if (isShipinkConfigured()) {
    return createShipmentViaShipink(order, cargoCompany, params.performedById);
  }

  return createShipmentViaLegacy(order, cargoCompany, params.performedById);
}

function mapCargoCodeToBasitKargoHandler(code: string): string {
  const map: Record<string, string> = {
    aras: "ARAS",
    mng: "MNG",
    yurtici: "YURTICI",
    surat: "SURAT",
    ptt: "PTT",
  };
  return map[code.toLowerCase()] || "ECONOMIC";
}

async function createShipmentViaBasitKargo(
  order: any,
  cargoCompany: any,
  handlerCode?: string,
  performedById?: string,
): Promise<ShipmentCreateResult> {
  const shippingAddr = order.shippingAddress as any;
  const districtName = shippingAddr?.district?.name || "";
  const cityName = shippingAddr?.district?.city || "";

  const resolvedHandler =
    handlerCode || mapCargoCodeToBasitKargoHandler(cargoCompany.code);

  const payload: BasitKargoOrderPayload = {
    handlerCode: resolvedHandler,
    type: "OUTGOING",
    content: {
      name: `Sipariş ${order.orderNumber}`,
      code: order.orderNumber,
      items: (order.items || []).map((item: any) => ({
        name: item.productName || "Ürün",
        code: item.productId || item.id,
        quantity: String(item.quantity),
      })),
      packages: [{ height: 10, width: 25, depth: 30, weight: 1 }],
    },
    client: {
      name: order.user?.name || "Müşteri",
      phone: order.user?.phone || "",
      city: cityName,
      town: districtName,
      address: shippingAddr?.fullAddress || "",
    },
  };

  const result = await createOrderWithBarcode(payload);

  const trackingNumber = result.barcode || null;
  let labelSvgUrl: string | null = null;

  if (result.id) {
    try {
      const svg = await getLabelSvg(result.id);
      if (svg && typeof svg === "string" && svg.length > 100) {
        const base64 = Buffer.from(svg).toString("base64");
        labelSvgUrl = `data:image/svg+xml;base64,${base64}`;
      }
    } catch (e) {
      console.error("[BASITKARGO_LABEL_SVG]", e);
    }
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "SHIPPED",
        shippedAt: new Date(),
        trackingNumber,
        cargoCompanyId: cargoCompany.id,
        shipinkOrderId: result.id,
        cargoTrackingUrl: null,
        cargoPdfUrl: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        entityId: order.id,
        entityType: "ORDER",
        action: "SHIPMENT_LABEL_CREATED",
        newValue: {
          status: "SHIPPED",
          trackingNumber,
          cargoCompanyId: cargoCompany.id,
          basitKargoId: result.id,
          handlerCode: resolvedHandler,
          provider: "basitkargo",
        },
        performedById,
      },
    }),
  ]);

  await notifyOrderShippedEmail(order.id);

  return {
    trackingNumber: trackingNumber || "",
    trackingUrl: buildTrackingUrl(cargoCompany.trackingUrl, trackingNumber || ""),
    cargoCompanyId: cargoCompany.id,
    cargoCompanyName: cargoCompany.name,
    labelSvgUrl,
    provider: "basitkargo",
  };
}

async function createShipmentViaShipink(
  order: any,
  cargoCompany: any,
  performedById?: string,
): Promise<ShipmentCreateResult> {
  const token = await getShipinkToken();

  const orderPayload = {
    customer: buildShipinkCustomerBlock({
      user: order.user,
      shippingAddress: order.shippingAddress,
    }),
    items: (order.items || []).map((item: any) => ({
      name: item.productName || "Ürün",
      quantity: item.quantity,
      price: Number(item.unitPrice ?? 0),
      category: "clothing",
    })),
    currency: "TRY",
    price: Number(order.total),
    payment: { method: "credit-card", status: "completed" },
  };

  const shipinkOrderId = await createShipinkOrder(token, orderPayload);

  const packagePayload = [
    { dimension_unit: "cm", height: 10, length: 30, width: 25, weight: 1, weight_unit: "kg" },
  ];

  const shipmentResult = await createOutgoingShipment(token, shipinkOrderId, packagePayload);

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
        status: "SHIPPED",
        shippedAt: new Date(),
        trackingNumber,
        cargoCompanyId: cargoCompany.id,
        shipinkOrderId,
        cargoPdfUrl,
        cargoTrackingUrl,
      },
    }),
    prisma.auditLog.create({
      data: {
        entityId: order.id,
        entityType: "ORDER",
        action: "SHIPMENT_LABEL_CREATED",
        newValue: {
          status: "SHIPPED",
          trackingNumber,
          cargoCompanyId: cargoCompany.id,
          shipinkOrderId,
          cargoPdfUrl,
        },
        performedById,
      },
    }),
  ]);

  await notifyOrderShippedEmail(order.id);

  return {
    trackingNumber: trackingNumber || "",
    trackingUrl: cargoTrackingUrl || buildTrackingUrl(cargoCompany.trackingUrl, trackingNumber || ""),
    cargoCompanyId: cargoCompany.id,
    cargoCompanyName: cargoCompany.name,
    pdfUrl: cargoPdfUrl,
  };
}

async function createShipmentViaLegacy(
  order: any,
  cargoCompany: any,
  performedById?: string,
): Promise<ShipmentCreateResult> {
  const recipientAddress = [
    order.shippingAddress?.district?.name,
    order.shippingAddress?.district?.city,
    order.shippingAddress?.fullAddress,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const external = await requestExternalCargoLabel({
    orderNumber: order.orderNumber,
    cargoCompanyCode: cargoCompany.code,
    recipientName: order.user.name || "",
    recipientPhone: order.user.phone || "",
    recipientEmail: order.user.email || "",
    recipientAddress,
  });

  const trackingNumber = String(external.trackingNumber).trim();
  const trackingUrl =
    external.trackingUrl || buildTrackingUrl(cargoCompany.trackingUrl, trackingNumber);

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "SHIPPED",
        shippedAt: new Date(),
        trackingNumber,
        cargoCompanyId: cargoCompany.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        entityId: order.id,
        entityType: "ORDER",
        action: "SHIPMENT_LABEL_CREATED",
        newValue: {
          status: "SHIPPED",
          trackingNumber,
          cargoCompanyId: cargoCompany.id,
        },
        performedById,
      },
    }),
  ]);

  await notifyOrderShippedEmail(order.id);

  return {
    trackingNumber,
    trackingUrl,
    cargoCompanyId: cargoCompany.id,
    cargoCompanyName: cargoCompany.name,
  };
}

export async function notifyOrderShippedEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          email: true,
        },
      },
      shippingAddress: true,
      billingAddress: true,
      cargoCompany: true,
    },
  });

  if (!order) {
    return { sent: false };
  }

  const to =
    order.email ||
    order.user?.email ||
    (order.shippingAddress as any)?.email ||
    (order.billingAddress as any)?.email;

  if (!to) {
    return { sent: false };
  }

  const cargoCompanyName = order.cargoCompany?.name || "Kargo Firması";
  const trackingNumber = order.trackingNumber ? String(order.trackingNumber).trim() : null;
  const trackingUrl = trackingNumber
    ? buildTrackingUrl(order.cargoCompany?.trackingUrl, trackingNumber)
    : null;

  await sendShipmentEmail({
    to,
    orderNumber: order.orderNumber,
    trackingNumber,
    trackingUrl,
    cargoCompanyName,
  });

  return { sent: true };
}

export async function applyCargoStatusWebhook(params: {
  payload: CargoWebhookPayload;
  performedById?: string;
}) {
  const status = normalizeCargoStatus(params.payload.status || params.payload.cargo_status);
  const trackingNumber = params.payload.tracking_number || params.payload.trackingNumber;
  const orderId = params.payload.order_id || params.payload.orderId;

  if (!trackingNumber && !orderId) {
    throw new Error("CARGO_WEBHOOK_IDENTIFIER_MISSING");
  }

  const where = orderId ? { id: orderId } : { trackingNumber };
  const order = await prisma.order.findFirst({ where });
  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  if (status !== "delivered") {
    return { ignored: true, orderId: order.id, status };
  }

  if (order.status === "COMPLETED") {
    return { ignored: true, orderId: order.id, status: "already_completed" };
  }

  if (!canTransitionToCompletedFrom(order.status)) {
    return {
      ignored: true,
      orderId: order.id,
      status: "invalid_transition",
      currentStatus: order.status,
    };
  }

  const deliveredAt = order.deliveredAt || new Date();

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "COMPLETED",
        deliveredAt,
      },
    }),
    prisma.auditLog.create({
      data: {
        entityId: order.id,
        entityType: "ORDER",
        action: "CARGO_WEBHOOK_DELIVERED",
        newValue: {
          status: "COMPLETED",
          deliveredAt: deliveredAt.toISOString(),
        },
        performedById: params.performedById,
      },
    }),
  ]);

  return {
    ignored: false,
    orderId: order.id,
    status: "COMPLETED",
  };
}
