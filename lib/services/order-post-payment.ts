import { prisma } from "../db";
import { resend } from "../resend";
import { buildDistanceSalesContractHtmlForOrder } from "@/lib/legal/distance-sales-contract";
import { createShipmentLabelForOrder } from "./cargo";
import { fromKurus, sumKurus, toKurus } from "../utils/money";
import { randomUUID } from "crypto";
import { withDefaultCompanyProfile } from "@/lib/invoice/company-profile";
import { sendAdminOrderWhatsApp } from "@/lib/whatsapp";

const VAT_RATE = 20;
const DEFAULT_TCKN_VKN = "11111111111";
const DEFAULT_INVOICE_PREFIX = "DRK";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrencyTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDateTr(value: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function buildAddressBlock(address: {
  fullName?: string | null;
  phone?: string | null;
  fullAddress?: string | null;
  district?: { name?: string | null; city?: string | null } | null;
} | null): string {
  if (!address) {
    return "<p style=\"margin:0;color:#6b7280;font-size:13px;line-height:1.6;\">Adres bilgisi bulunamadı.</p>";
  }

  const name = address.fullName ? `<p style="margin:0 0 6px;color:#111827;font-weight:600;font-size:14px;">${escapeHtml(address.fullName)}</p>` : "";
  const phone = address.phone ? `<p style="margin:0 0 4px;color:#374151;font-size:13px;">${escapeHtml(address.phone)}</p>` : "";
  const fullAddress = address.fullAddress ? `<p style="margin:0 0 4px;color:#374151;font-size:13px;line-height:1.6;">${escapeHtml(address.fullAddress)}</p>` : "";

  const locationParts = [address.district?.name, address.district?.city].filter(Boolean).map((part) => escapeHtml(String(part)));
  const location = locationParts.length > 0
    ? `<p style="margin:0;color:#374151;font-size:13px;">${locationParts.join(", ")}</p>`
    : "";

  return `${name}${phone}${fullAddress}${location}`;
}

function buildGibInvoiceNumber(year: number, sequence: number): string {
  return `${DEFAULT_INVOICE_PREFIX}${year}${sequence.toString().padStart(9, "0")}`;
}

function toExTaxKurusFromGross(grossKurus: number): number {
  return Math.round((grossKurus * 100) / (100 + VAT_RATE));
}

export async function ensureInvoiceForOrder(orderId: string) {
  const existing = await prisma.invoice.findFirst({
    where: { orderId },
    select: { id: true, invoiceNumber: true },
  });

  if (existing) {
    return {
      ...existing,
      created: false,
    };
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

  if (!order || (order.paymentStatus !== "PAID" && order.paymentStatus !== "SUCCEEDED")) {
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

  return {
    ...created,
    created: true,
  };
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
                <a href="${siteUrl}/profile/orders" style="background-color:#111;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
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
      items: {
        orderBy: { createdAt: "asc" },
      },
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
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.dark-velvet.com";

  const subtotal = typeof order.subtotal === "number" ? order.subtotal : order.total;
  const shippingCost = Number(order.shippingCost || 0);
  const discount = Number(order.discount || 0);
  const createdAtLabel = formatDateTr(order.createdAt);

  const itemsHtml = order.items
    .map((item: {
      image: string | null;
      productName: string;
      colorName: string | null;
      sizeName: string | null;
      quantity: number;
      totalPrice: number;
    }) => {
      const imageCell = item.image
        ? `
          <td width="74" style="padding:12px 0;vertical-align:top;">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.productName)}" width="64" height="64" style="display:block;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;" />
          </td>
        `
        : "<td width=\"10\" style=\"padding:0;\"></td>";

      const variantParts = [item.colorName, item.sizeName].filter(Boolean).map((part) => escapeHtml(String(part)));
      const variant = variantParts.length ? `<div style="margin-top:4px;color:#6b7280;font-size:12px;">${variantParts.join(" / ")}</div>` : "";

      return `
        <tr>
          ${imageCell}
          <td style="padding:12px 0;vertical-align:top;">
            <div style="color:#111827;font-size:14px;font-weight:600;line-height:1.5;">${escapeHtml(item.productName)}</div>
            ${variant}
            <div style="margin-top:4px;color:#6b7280;font-size:12px;">Adet: ${item.quantity}</div>
          </td>
          <td style="padding:12px 0;text-align:right;vertical-align:top;color:#111827;font-size:14px;font-weight:600;white-space:nowrap;">
            ${formatCurrencyTry(item.totalPrice)}
          </td>
        </tr>
      `;
    })
    .join("");

  await resend.emails.send({
    from,
    to: userEmail,
    subject: `Siparişiniz alındı: ${order.orderNumber}`,
    html: `
      <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 28px 16px;background:linear-gradient(135deg,#111827 0%,#1f2937 100%);">
                    <div style="font-size:24px;font-weight:700;letter-spacing:0.4px;color:#ffffff;">Dark Velvet</div>
                    <p style="margin:10px 0 0;color:#d1d5db;font-size:13px;line-height:1.5;">Siparişiniz başarıyla alındı. Hazırlık süreci başladığında sizi tekrar bilgilendireceğiz.</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 28px 8px;">
                    <h1 style="margin:0 0 10px;font-size:26px;line-height:1.2;color:#111827;">Siparişiniz için teşekkür ederiz</h1>
                    <p style="margin:0 0 14px;font-size:15px;color:#374151;">Merhaba ${escapeHtml(userName)},</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
                      <strong>${escapeHtml(order.orderNumber)}</strong> numaralı siparişiniz başarıyla oluşturuldu.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:10px 28px 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">Sipariş Numarası</p>
                          <p style="margin:0;color:#111827;font-size:16px;font-weight:700;">${escapeHtml(order.orderNumber)}</p>
                        </td>
                        <td style="padding:14px 16px;">
                          <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">Sipariş Tarihi</p>
                          <p style="margin:0;color:#111827;font-size:16px;font-weight:700;">${createdAtLabel}</p>
                        </td>
                        <td style="padding:14px 16px;text-align:right;">
                          <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">Sipariş Tutarı</p>
                          <p style="margin:0;color:#111827;font-size:16px;font-weight:700;">${formatCurrencyTry(order.total)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 28px 4px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 0 8px;">
                          <h2 style="margin:0;font-size:16px;color:#111827;">Sipariş İçeriği</h2>
                        </td>
                      </tr>
                      ${itemsHtml || "<tr><td style=\"padding:10px 0;color:#6b7280;font-size:13px;\">Sipariş kalemi bulunamadı.</td></tr>"}
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:6px 28px 2px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">
                      <tr>
                        <td style="padding:12px 0;color:#6b7280;font-size:13px;">Ara Toplam</td>
                        <td style="padding:12px 0;text-align:right;color:#111827;font-size:13px;">${formatCurrencyTry(subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Kargo</td>
                        <td style="padding:6px 0;text-align:right;color:#111827;font-size:13px;">${shippingCost > 0 ? formatCurrencyTry(shippingCost) : "Ücretsiz"}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">İndirim</td>
                        <td style="padding:6px 0;text-align:right;color:#111827;font-size:13px;">${discount > 0 ? `-${formatCurrencyTry(discount)}` : formatCurrencyTry(0)}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0 4px;color:#111827;font-size:15px;font-weight:700;">Toplam</td>
                        <td style="padding:14px 0 4px;text-align:right;color:#111827;font-size:18px;font-weight:700;">${formatCurrencyTry(order.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 28px 2px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding:0 10px 12px 0;vertical-align:top;">
                          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;min-height:120px;">
                            <h3 style="margin:0 0 10px;font-size:14px;color:#111827;">Teslimat Adresi</h3>
                            ${buildAddressBlock(order.shippingAddress)}
                          </div>
                        </td>
                        <td width="50%" style="padding:0 0 12px 10px;vertical-align:top;">
                          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;min-height:120px;">
                            <h3 style="margin:0 0 10px;font-size:14px;color:#111827;">Fatura Adresi</h3>
                            ${buildAddressBlock(order.billingAddress || order.shippingAddress)}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 28px 26px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <a href="${siteUrl}/profile/orders" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:8px;">Siparişimi Görüntüle</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;color:#6b7280;font-size:12px;line-height:1.6;">
                      Siparişiniz hazırlanıp kargoya verildiğinde takip bilgilerini ayrıca e-posta ile paylaşacağız.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:14px 0 0;color:#9ca3af;font-size:11px;line-height:1.6;text-align:center;">
                © ${new Date().getFullYear()} Dark Velvet. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}

export async function runOrderPostPaymentTasks(orderId: string) {
  await sendOrderPaidEmail(orderId);

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
        invoiceNumber: null,
        autoShipmentRequested: process.env.AUTO_CREATE_SHIPMENT_LABEL === "true",
      },
    },
  });
}
