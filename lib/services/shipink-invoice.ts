import { prisma } from "@/lib/db";
import { getShipinkAccessToken } from "@/lib/shipinkAuthService";
import { withDefaultCompanyProfile } from "@/lib/invoice/company-profile";
import { getShipinkApiBaseUrl } from "@/lib/shipinkApiBase";

export interface ShipinkInvoiceResult {
  ettn: string;
  invoiceNumber: string;
  pdfUrl: string;
  status: string;
}

export interface ShipinkInvoiceError {
  code: string;
  message: string;
  details?: unknown;
}

export class ShipinkInvoiceServiceError extends Error {
  code: string;
  details?: unknown;

  constructor({ code, message, details }: ShipinkInvoiceError) {
    super(message);
    this.name = "ShipinkInvoiceServiceError";
    this.code = code;
    this.details = details;
  }
}

interface OrderForInvoice {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  createdAt: Date;
  paidAt: Date | null;
  email: string | null;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    colorName: string | null;
    sizeName: string | null;
  }>;
  shippingAddress: {
    fullName: string | null;
    phone: string | null;
    fullAddress: string | null;
    district: { name: string | null; city: string | null } | null;
  } | null;
  billingAddress: {
    fullName: string | null;
    phone: string | null;
    fullAddress: string | null;
    district: { name: string | null; city: string | null } | null;
  } | null;
}

function buildShipinkInvoicePayload(order: OrderForInvoice, company: Record<string, unknown>) {
  const customer = order.billingAddress || order.shippingAddress;
  const customerName = customer?.fullName || order.user?.name || "Müşteri";
  const customerPhone = customer?.phone || order.user?.phone || "";
  const customerEmail = order.email || order.user?.email || "";
  const customerCity = customer?.district?.city || "";
  const customerDistrict = customer?.district?.name || "";
  const customerAddress = customer?.fullAddress || "";

  const nameParts = customerName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || nameParts[0] || "Müşteri";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const issueDate = new Date();
  const issueDateStr = issueDate.toISOString().split("T")[0];
  const issueTimeStr = issueDate.toTimeString().split(" ")[0];

  const vatRate = 20;

  const invoiceLines = order.items.map((item, idx) => {
    const lineTotal = item.totalPrice;
    const taxExclusive = lineTotal / (1 + vatRate / 100);
    const taxAmount = lineTotal - taxExclusive;

    return {
      lineNumber: idx + 1,
      productName: item.productName,
      productCode: `PROD-${item.id.slice(0, 8).toUpperCase()}`,
      quantity: item.quantity,
      unitCode: "NIU",
      unitPrice: taxExclusive / item.quantity,
      lineExtensionAmount: taxExclusive,
      taxRate: vatRate,
      taxAmount,
      lineTotalWithTax: lineTotal,
    };
  });

  const totalTaxExclusive = invoiceLines.reduce((sum, l) => sum + l.lineExtensionAmount, 0);
  const totalTaxAmount = invoiceLines.reduce((sum, l) => sum + l.taxAmount, 0);
  const payableAmount = order.total;

  return {
    invoiceType: "EARSIVFATURA",
    invoiceScenario: "EARSIVFATURA",
    invoiceTypeCode: "SATIS",
    profileId: "EARSIVFATURA",
    currency: "TRY",
    issueDate: issueDateStr,
    issueTime: issueTimeStr,
    orderReference: order.orderNumber,
    sendNotification: false,
    supplier: {
      name: (company.companyName as string) || "CIHAN MERT OZCAN",
      taxNumber: (company.taxNumber as string) || "1063374910",
      taxOffice: (company.taxOffice as string) || "KARTAL VERGI DAIRESI MUD",
      address: (company.companyAddress as string) || "",
      phone: (company.phone as string) || "",
      email: (company.email as string) || "",
    },
    customer: {
      firstName,
      lastName,
      fullName: customerName,
      taxNumber: "11111111111",
      email: customerEmail,
      phone: customerPhone,
      address: customerAddress,
      city: customerCity,
      district: customerDistrict,
      country: "Türkiye",
    },
    lines: invoiceLines,
    totals: {
      lineExtensionAmount: totalTaxExclusive,
      taxExclusiveAmount: totalTaxExclusive,
      taxAmount: totalTaxAmount,
      taxInclusiveAmount: payableAmount,
      payableAmount,
    },
  };
}

async function callShipinkInvoiceApi(token: string, payload: unknown): Promise<ShipinkInvoiceResult> {
  const response = await fetch(`${getShipinkApiBaseUrl()}/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ShipinkInvoiceServiceError({
      code: "SHIPINK_API_ERROR",
      message:
        responseBody?.message ||
        responseBody?.error ||
        `Shipink fatura API hata döndü: ${response.status}`,
      details: responseBody,
    });
  }

  const data = responseBody?.data || responseBody;

  if (!data?.ettn && !data?.uuid) {
    throw new ShipinkInvoiceServiceError({
      code: "SHIPINK_MISSING_ETTN",
      message: "Shipink yanıtında ETTN bilgisi bulunamadı.",
      details: responseBody,
    });
  }

  return {
    ettn: data.ettn || data.uuid || "",
    invoiceNumber: data.invoiceNumber || data.invoice_number || "",
    pdfUrl: data.pdfUrl || data.pdf_url || data.documentUrl || "",
    status: data.status || "CREATED",
  };
}

/**
 * Bir siparişi Shipink API üzerinden faturalandırır.
 * PDF URL ve ETTN'i veritabanına kaydeder.
 * Shipink'in kendi bildirim/mail göndermesini devre dışı bırakır.
 */
export async function createShipinkInvoice(orderId: string): Promise<ShipinkInvoiceResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          colorName: true,
          sizeName: true,
        },
      },
      shippingAddress: { include: { district: true } },
      billingAddress: { include: { district: true } },
    },
  });

  if (!order) {
    throw new ShipinkInvoiceServiceError({
      code: "ORDER_NOT_FOUND",
      message: `Sipariş bulunamadı: ${orderId}`,
    });
  }

  if (order.paymentStatus !== "PAID" && order.paymentStatus !== "SUCCEEDED") {
    throw new ShipinkInvoiceServiceError({
      code: "ORDER_NOT_PAID",
      message: "Fatura yalnızca ödemesi tamamlanan siparişler için oluşturulabilir.",
    });
  }

  const existingInvoiceUrl = (order as any).invoiceUrl;
  const existingEttn = (order as any).invoiceEttn;
  if (existingInvoiceUrl && existingEttn) {
    return {
      ettn: existingEttn,
      invoiceNumber: "",
      pdfUrl: existingInvoiceUrl,
      status: "ALREADY_EXISTS",
    };
  }

  const companySettings = withDefaultCompanyProfile(await prisma.companySettings.findFirst());
  const token = await getShipinkAccessToken();
  const payload = buildShipinkInvoicePayload(order as unknown as OrderForInvoice, companySettings);

  const result = await callShipinkInvoiceApi(token, payload);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      invoiceUrl: result.pdfUrl,
      invoiceEttn: result.ettn,
    },
  });

  const existingInvoiceRecord = await prisma.invoice.findFirst({
    where: { orderId },
    select: { id: true },
  });

  if (existingInvoiceRecord) {
    await prisma.invoice.update({
      where: { id: existingInvoiceRecord.id },
      data: { status: "ISSUED" },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "SHIPINK_FATURA_OLUSTURULDU",
      entityType: "ORDER",
      entityId: orderId,
      details: {
        ettn: result.ettn,
        invoiceNumber: result.invoiceNumber,
        pdfUrl: result.pdfUrl,
      },
    },
  });

  return result;
}

/**
 * Shipink'ten faturanın PDF URL'sini sorgular (varsa).
 * Fatura zaten veritabanında kayıtlıysa doğrudan döner.
 */
export async function getShipinkInvoicePdfUrl(orderId: string): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { invoiceUrl: true, invoiceEttn: true },
  });

  if (!order) return null;
  if (order.invoiceUrl) return order.invoiceUrl;

  if (!order.invoiceEttn) return null;

  try {
    const token = await getShipinkAccessToken();
    const response = await fetch(`${getShipinkApiBaseUrl()}/invoices/${order.invoiceEttn}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const pdfUrl = data?.data?.pdfUrl || data?.pdfUrl || data?.pdf_url || null;

    if (pdfUrl) {
      await prisma.order.update({
        where: { id: orderId },
        data: { invoiceUrl: pdfUrl },
      });
    }

    return pdfUrl;
  } catch {
    return null;
  }
}
