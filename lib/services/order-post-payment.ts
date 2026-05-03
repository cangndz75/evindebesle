import { prisma } from "../db";
import { resend } from "../resend";
import { buildDistanceSalesContractHtmlForOrder } from "@/lib/legal/distance-sales-contract";
import { createShipmentLabelForOrder } from "./cargo";
import { fromKurus, sumKurus, toKurus } from "../utils/money";
import { randomUUID } from "crypto";
import { withDefaultCompanyProfile } from "@/lib/invoice/company-profile";

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

  const userName = order.user?.name || order.shippingAddress?.fullName || order.billingAddress?.fullName || "Misafir Kullanıcı";
  const userEmail =
    order.email || order.user?.email || order.shippingAddress?.email || order.billingAddress?.email || null;
  const userPhone = order.user?.phone || order.shippingAddress?.phone || order.billingAddress?.phone || null;

  const companySettings = withDefaultCompanyProfile(await prisma.companySettings.findFirst());

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
  const ettn = randomUUID().replaceAll("-", "");

  const customerSnapshot = {
    name: userName,
    email: userEmail,
    phone: userPhone,
    address: customerAddress,
    addressText: fullAddressText,
    taxNumber,
    taxOffice: (order.user as any)?.taxOffice || "-",
    ettn,
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

export async function sendInvoiceCreatedEmail(orderId: string, invoiceNumber: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      shippingAddress: true,
      billingAddress: true,
    },
  });

  if (!order) return;

  const userName =
    order.user?.name ||
    order.shippingAddress?.fullName ||
    order.billingAddress?.fullName ||
    "Değerli Müşterimiz";
  const userEmail =
    order.email ||
    order.user?.email ||
    (order.shippingAddress as any)?.email ||
    (order.billingAddress as any)?.email;

  if (!userEmail) return;

  const from = process.env.ORDER_MAIL_FROM || "siparis@dark-velvet.com";
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.dark-velvet.com";

  await resend.emails.send({
    from,
    to: userEmail,
    subject: `Faturanız oluşturuldu — ${order.orderNumber}`,
    html: `
      <div style="background-color:#f3f4f6;padding:0;margin:0;font-family:Arial,sans-serif;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background-color:white;">
          <tr>
            <td style="padding:24px 32px;text-align:left;">
              <h1 style="margin:0;color:#000;font-size:24px;">Dark Velvet</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <h2 style="font-size:20px;color:#111;">Merhaba ${userName},</h2>
              <p style="font-size:16px;line-height:1.6;color:#333;">
                <strong>${order.orderNumber}</strong> numaralı siparişinize ait faturanız oluşturulmuştur.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Fatura Numarası</p>
                    <p style="margin:0;font-size:18px;font-weight:bold;color:#111;">${invoiceNumber}</p>
                  </td>
                  <td style="padding:16px;text-align:right;">
                    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Toplam Tutar</p>
                    <p style="margin:0;font-size:18px;font-weight:bold;color:#111;">${order.total.toFixed(2)} TRY</p>
                  </td>
                </tr>
              </table>
              <p style="font-size:14px;line-height:1.6;color:#555;">
                Faturanıza hesabınız üzerinden veya aşağıdaki bağlantıdan ulaşabilirsiniz.
              </p>
              <div style="margin:24px 0;text-align:center;">
                <a href="${siteUrl}/hesabim/siparislerim" style="background-color:#111;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                  Siparişlerimi Görüntüle
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;" />
              <p style="font-size:13px;color:#555;text-align:center;margin-top:16px;">
                Herhangi bir sorunuz varsa bize ulaşabilirsiniz.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;font-size:11px;color:#999;text-align:center;">
              © ${new Date().getFullYear()} Dark Velvet. Tüm hakları saklıdır.
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}

async function sendDistanceSalesContractEmail(orderId: string) {
  const html = await buildDistanceSalesContractHtmlForOrder(orderId);
  if (!html) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true } },
      shippingAddress: true,
      billingAddress: true,
    },
  });
  if (!order) return;

  const to =
    order.email ||
    order.user?.email ||
    order.shippingAddress?.email ||
    order.billingAddress?.email;
  if (!to) return;

  const from = process.env.ORDER_MAIL_FROM || "siparis@dark-velvet.com";

  await resend.emails.send({
    from,
    to,
    subject: `Mesafeli Satış Sözleşmesi — ${order.orderNumber}`,
    html,
  });
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
      shippingAddress: true,
      billingAddress: true,
    },
  });

  if (!order) {
    return;
  }

  // Misafir kullanıcı desteği
  const userName = order.user?.name || order.shippingAddress?.fullName || order.billingAddress?.fullName || "Degerli Musterimiz";
  const userEmail =
    order.email ||
    order.user?.email ||
    order.shippingAddress?.email ||
    order.billingAddress?.email;

  if (!userEmail) {
    return;
  }

  const from = process.env.ORDER_MAIL_FROM || "siparis@dark-velvet.com";

  await resend.emails.send({
    from,
    to: userEmail,
    subject: `Siparişiniz alındı: ${order.orderNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Siparişiniz alındı</h2>
        <p>Merhaba ${userName},</p>
        <p><strong>${order.orderNumber}</strong> numaralı siparişiniz başarıyla alındı.</p>
        <p>Toplam tutar: <strong>${order.total.toFixed(2)} TRY</strong></p>
        <p>Siparişiniz hazırlandığında kargo bilgilendirmesi e-posta ile iletilecektir.</p>
      </div>
    `,
  });
}

export async function runOrderPostPaymentTasks(orderId: string) {
  const invoice = await ensureInvoiceForOrder(orderId);
  await sendOrderPaidEmail(orderId);

  if (invoice?.invoiceNumber) {
    try {
      await sendInvoiceCreatedEmail(orderId, invoice.invoiceNumber);
    } catch (e) {
      console.error("Fatura oluşturuldu e-postası gönderilemedi:", e);
    }
  }

  try {
    await sendDistanceSalesContractEmail(orderId);
  } catch (e) {
    console.error("Mesafeli satış sözleşmesi e-postası gönderilemedi:", e);
  }

  if (process.env.AUTO_CREATE_SHIPMENT_LABEL === "true") {
    try {
      await createShipmentLabelForOrder({
        orderId,
      });
    } catch (error) {
      console.error("Otomatik kargo etiketi hatası:", error);
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "ODEME_SONRASI_GOREVLER_TAMAMLANDI",
      entityType: "SIPARIS",
      entityId: orderId,
      details: {
        invoiceNumber: invoice?.invoiceNumber || null,
        autoShipmentRequested: process.env.AUTO_CREATE_SHIPMENT_LABEL === "true",
      },
    },
  });
}
