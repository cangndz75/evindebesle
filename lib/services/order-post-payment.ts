import { prisma } from "../db";
import { resend } from "../resend";
import { createShipmentLabelForOrder } from "./cargo";
import { fromKurus, sumKurus, toKurus } from "../utils/money";

const VAT_RATE = 20;
const DEFAULT_TCKN_VKN = "11111111111";
const DEFAULT_INVOICE_PREFIX = "DRK";

function buildGibInvoiceNumber(year: number, sequence: number): string {
  return `${DEFAULT_INVOICE_PREFIX}${year}${sequence.toString().padStart(9, "0")}`;
}

function toExTaxKurusFromGross(grossKurus: number): number {
  return Math.round((grossKurus * 100) / (100 + VAT_RATE));
}

async function ensureInvoiceForOrder(orderId: string) {
  const existing = await prisma.invoice.findFirst({
    where: { orderId },
    select: { id: true, invoiceNumber: true },
  });

  if (existing) {
    return existing;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: true,
      shippingAddress: {
        include: {
          district: true,
        },
      },
      billingAddress: {
        include: {
          district: true,
        },
      },
    },
  });

  if (!order || order.paymentStatus !== "PAID") {
    return null;
  }

  const companySettings = await prisma.companySettings.findFirst();

  const year = new Date().getFullYear();
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
  const nextYearStart = new Date(`${year + 1}-01-01T00:00:00.000Z`);
  const countForYear = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: yearStart,
        lt: nextYearStart,
      },
    },
  });

  const invoiceNumber = buildGibInvoiceNumber(year, countForYear + 1);

  const customerAddress = order.billingAddress || order.shippingAddress;
  const districtName = customerAddress?.district?.name || "";
  const cityName = customerAddress?.district?.city || "";
  const addressLine = customerAddress?.fullAddress || "";
  const fullAddressText = [districtName, cityName, addressLine].filter(Boolean).join(" ").trim();

  const rawTaxNumber = (order.user as any)?.taxNumber || (customerAddress as any)?.taxNumber;
  const taxNumber = String(rawTaxNumber || DEFAULT_TCKN_VKN);

  const customerSnapshot = {
    name: order.user.name,
    email: order.user.email,
    phone: order.user.phone,
    address: customerAddress,
    addressText: fullAddressText,
    taxNumber,
    taxOffice: (order.user as any)?.taxOffice || "-",
  };

  const itemsSnapshot = order.items.map((item: any) => ({
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
    taxRate: VAT_RATE,
  }));

  const itemGrossKurus = sumKurus(order.items.map((item: any) => item.totalPrice));
  const itemNetKurus = toExTaxKurusFromGross(itemGrossKurus);
  const itemTaxKurus = itemGrossKurus - itemNetKurus;

  const totalAmount = fromKurus(toKurus(order.total));
  const taxAmount = fromKurus(itemTaxKurus);
  const netAmount = fromKurus(itemNetKurus);

  const created = await prisma.invoice.create({
    data: {
      invoiceNumber,
      orderId: order.id,
      status: "ISSUED",
      companyDetails: companySettings || {},
      customerDetails: customerSnapshot,
      items: itemsSnapshot,
      subtotal: netAmount,
      taxAmount,
      totalAmount,
      issuedAt: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
    },
    select: { id: true, invoiceNumber: true },
  });

  return created;
}

async function sendOrderPaidEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order?.user?.email) {
    return;
  }

  const from = process.env.ORDER_MAIL_FROM || "siparis@dark-velvet.com";

  await resend.emails.send({
    from,
    to: order.user.email,
    subject: `Siparisiniz alindi: ${order.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Siparisiniz alindi</h2>
        <p>Merhaba ${order.user.name || "Degerli Musterimiz"},</p>
        <p><strong>${order.orderNumber}</strong> numarali siparisiniz basariyla alindi.</p>
        <p>Toplam tutar: <strong>${order.total.toFixed(2)} TRY</strong></p>
        <p>Siparisiniz hazirlandiginda kargo bilgilendirmesi e-posta ile iletilecektir.</p>
      </div>
    `,
  });
}

export async function runOrderPostPaymentTasks(orderId: string) {
  const invoice = await ensureInvoiceForOrder(orderId);
  await sendOrderPaidEmail(orderId);

  if (process.env.AUTO_CREATE_SHIPMENT_LABEL === "true") {
    try {
      await createShipmentLabelForOrder({
        orderId,
      });
    } catch (error) {
      console.error("Auto shipment label error:", error);
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "POST_PAYMENT_TASKS_COMPLETED",
      entityType: "ORDER",
      entityId: orderId,
      details: {
        invoiceNumber: invoice?.invoiceNumber || null,
        autoShipmentRequested: process.env.AUTO_CREATE_SHIPMENT_LABEL === "true",
      },
    },
  });
}
