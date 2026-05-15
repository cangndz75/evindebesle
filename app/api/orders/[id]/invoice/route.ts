import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import puppeteer from "puppeteer";
import { renderInvoiceHTML } from "@/lib/invoice/renderInvoiceHTML";
import { toInvoiceDTO } from "@/lib/api/dto/order";
import { jsonNoStore } from "@/lib/api/policy";
import QRCode from "qrcode";
import { buildGibQrContent, formatQrIssueDate, resolveInvoiceEttn } from "@/lib/invoice/qr";
import { withDefaultCompanyProfile } from "@/lib/invoice/company-profile";
import { decryptPiiIfNeeded, isEncryptedAtRest } from "@/lib/security/at-rest-crypto";

export const dynamic = "force-dynamic";

const VAT_RATE = 20;
const DEFAULT_TAX_NUMBER = "11111111111";

function decryptJsonPiiStrings(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    return isEncryptedAtRest(value) ? decryptPiiIfNeeded(value) : value;
  }
  if (Array.isArray(value)) {
    return value.map((x) => decryptJsonPiiStrings(x));
  }
  if (typeof value === "object" && value !== null && value.constructor === Object) {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      out[k] = decryptJsonPiiStrings(v);
    }
    return out;
  }
  return value;
}

function buildFallbackCustomer(order: {
  user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  billingAddress?: {
    fullAddress?: string | null;
    district?: { name?: string | null; city?: string | null } | null;
  } | null;
  shippingAddress?: {
    fullAddress?: string | null;
    district?: { name?: string | null; city?: string | null } | null;
  } | null;
}) {
  const customerAddress = order.billingAddress || order.shippingAddress;
  const districtName = customerAddress?.district?.name || "";
  const cityName = customerAddress?.district?.city || "";
  const addressLine = decryptPiiIfNeeded(customerAddress?.fullAddress ?? "");

  return {
    name: order.user?.name || "-",
    email: order.user?.email || "",
    phone: decryptPiiIfNeeded(order.user?.phone ?? ""),
    taxOffice: "-",
    taxNumber: DEFAULT_TAX_NUMBER,
    addressText: [districtName, cityName, addressLine].filter(Boolean).join(" ").trim(),
  };
}

function orderIsInvoiceEligible(order: { paymentStatus: string; status: string }): boolean {
  return (
    order.paymentStatus === "PAID" ||
    order.paymentStatus === "SUCCEEDED" ||
    order.status === "PAID"
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(request);

    if (!user) {
      return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            color: { select: { name: true } },
            size: { select: { name: true } },
          },
        },
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
        billingAddress: {
          include: {
            district: true,
          },
        },
      },
    });

    if (!order) {
      return jsonNoStore({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id && !user.isAdmin) {
      return jsonNoStore({ error: "Forbidden" }, { status: 403 });
    }

    if (!orderIsInvoiceEligible(order)) {
      return jsonNoStore(
        { error: "Fatura yalnızca ödemesi tamamlanan siparişler için oluşturulabilir." },
        { status: 400 }
      );
    }

    const companySettings = withDefaultCompanyProfile(await prisma.companySettings.findFirst());

    const invoiceRecord = await prisma.invoice.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
    });

    const orderDto = toInvoiceDTO(order);

    const items = Array.isArray((invoiceRecord?.items as any[] | undefined))
      ? (invoiceRecord?.items as any[])
      : orderDto.items.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          taxRate: VAT_RATE,
        }));

    const subtotal = typeof invoiceRecord?.subtotal === "number" ? invoiceRecord.subtotal : orderDto.subtotal;
    const taxAmount =
      typeof invoiceRecord?.taxAmount === "number" ? invoiceRecord.taxAmount : orderDto.subtotal * (VAT_RATE / 100);
    const totalAmount = typeof invoiceRecord?.totalAmount === "number" ? invoiceRecord.totalAmount : orderDto.total;

    const customerDetailsRaw =
      invoiceRecord?.customerDetails && typeof invoiceRecord.customerDetails === "object"
        ? (invoiceRecord.customerDetails as Record<string, unknown>)
        : buildFallbackCustomer(order);

    const customerDetails = decryptJsonPiiStrings(customerDetailsRaw) as Record<string, unknown>;

    const companyDetails =
      invoiceRecord?.companyDetails && typeof invoiceRecord.companyDetails === "object"
        ? withDefaultCompanyProfile(invoiceRecord.companyDetails)
        : (companySettings as Record<string, unknown>);

    const invoicePayload = {
      invoiceNumber: invoiceRecord?.invoiceNumber || `SIP-${order.orderNumber}`,
      ettn: resolveInvoiceEttn({
        invoiceId: invoiceRecord?.id || order.id,
        customerDetails,
        companyDetails,
      }),
      issuedAt: invoiceRecord?.issuedAt || order.paidAt || order.createdAt,
      dueDate: invoiceRecord?.dueDate || null,
      scenario: "EARSIVFATURA",
      type: "SATIS",
      customizationNo: "TR1.2",
      subtotal,
      taxAmount,
      totalAmount,
      items,
      customerDetails,
    };

    const sellerTaxId =
      String((companyDetails as Record<string, unknown>)?.taxNumber || "").trim() || DEFAULT_TAX_NUMBER;
    const issueDate = formatQrIssueDate(invoicePayload.issuedAt);
    const qrContent = buildGibQrContent({
      sellerTaxId,
      invoiceNumber: invoicePayload.invoiceNumber,
      ettn: invoicePayload.ettn,
      issueDate,
      payableAmount: invoicePayload.totalAmount,
    });

    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      margin: 1,
      width: 180,
      errorCorrectionLevel: "M",
    });

    const html = renderInvoiceHTML({
      order: orderDto,
      invoice: invoicePayload,
      company: companyDetails || {
        companyName: "CIHAN MERT OZCAN",
        companyAddress: "YUNUS MAH. ERSIN SK NO:8/3 KARTAL ISTANBUL",
        taxOffice: "KARTAL VERGI DAIRESI MUD",
        taxNumber: "1063374910",
        phone: "5356818375",
        email: "info@dark-velvet.com",
        logoUrl: "",
        website: "https://www.dark-velvet.com",
      },
      qrDataUrl,
    });

    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
      });

      await browser.close();
      browser = undefined;

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="fatura-${order.orderNumber}.pdf"`,
        },
      });
    } catch (puppeteerError) {
      console.error("Invoice PDF (Puppeteer) error:", puppeteerError);
      await browser?.close().catch(() => undefined);

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="fatura-${order.orderNumber}.html"`,
        },
      });
    }
  } catch (error: unknown) {
    console.error("Invoice generation error", error instanceof Error ? error.message : error);

    return jsonNoStore({ error: "INVOICE_GENERATION_EXCEPTION" }, { status: 500 });
  }
}
