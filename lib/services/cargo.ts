import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";
import { canTransitionToCompletedFrom } from "@/lib/services/cargo-state";

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

export async function createShipmentLabelForOrder(params: {
  orderId: string;
  cargoCompanyCode?: string;
  performedById?: string;
}): Promise<CreateShipmentResult> {
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
    };
  }

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
        performedById: params.performedById,
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
