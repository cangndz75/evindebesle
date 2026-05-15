import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { jsonNoStore } from "@/lib/api/policy";
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
  const addr = order.billingAddress || order.shippingAddress;
  const districtName = addr?.district?.name || "";
  const cityName = addr?.district?.city || "";
  const addressLine = decryptPiiIfNeeded(addr?.fullAddress ?? "");

  return {
    name: order.user?.name || "-",
    email: order.user?.email || "",
    phone: decryptPiiIfNeeded(order.user?.phone ?? ""),
    taxOffice: "-",
    taxNumber: DEFAULT_TAX_NUMBER,
    addressText: [districtName, cityName, addressLine].filter(Boolean).join(" ").trim(),
  };
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
        user: { select: { name: true, email: true, phone: true } },
        shippingAddress: { include: { district: true } },
        billingAddress: { include: { district: true } },
        cargoCompany: { select: { name: true, code: true } },
        returnRequests: {
          include: {
            items: {
              include: {
                orderItem: {
                  select: {
                    productName: true,
                    colorName: true,
                    sizeName: true,
                    quantity: true,
                    unitPrice: true,
                    totalPrice: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return jsonNoStore({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== user.id && !user.isAdmin) {
      return jsonNoStore({ error: "Forbidden" }, { status: 403 });
    }

    const eligible =
      order.paymentStatus === "PAID" ||
      order.paymentStatus === "SUCCEEDED" ||
      order.status === ("PAID" as string);

    if (!eligible) {
      return jsonNoStore(
        { error: "Fatura yalnızca ödemesi tamamlanan siparişler için oluşturulabilir." },
        { status: 400 }
      );
    }

    const companySettings = withDefaultCompanyProfile(
      await prisma.companySettings.findFirst()
    );

    const invoiceRecord = await prisma.invoice.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
    });

    const items = Array.isArray(invoiceRecord?.items as unknown[])
      ? (invoiceRecord!.items as { productName: string; quantity: number; unitPrice: number; totalPrice: number; taxRate: number }[])
      : order.items.map((item: { productName: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          taxRate: VAT_RATE,
        }));

    const subtotal =
      typeof invoiceRecord?.subtotal === "number"
        ? invoiceRecord.subtotal
        : order.subtotal;
    const taxAmount =
      typeof invoiceRecord?.taxAmount === "number"
        ? invoiceRecord.taxAmount
        : order.subtotal * (VAT_RATE / 100);
    const totalAmount =
      typeof invoiceRecord?.totalAmount === "number"
        ? invoiceRecord.totalAmount
        : order.total;

    const customerDetailsRaw =
      invoiceRecord?.customerDetails &&
      typeof invoiceRecord.customerDetails === "object"
        ? (invoiceRecord.customerDetails as Record<string, unknown>)
        : buildFallbackCustomer(order);

    const customerDetails = decryptJsonPiiStrings(customerDetailsRaw) as Record<string, unknown>;

    const companyDetails =
      invoiceRecord?.companyDetails &&
      typeof invoiceRecord.companyDetails === "object"
        ? withDefaultCompanyProfile(invoiceRecord.companyDetails)
        : (companySettings as Record<string, unknown>);

    return NextResponse.json({
      id: invoiceRecord?.id || order.id,
      invoiceNumber: invoiceRecord?.invoiceNumber || `SIP-${order.orderNumber}`,
      orderId: order.id,
      status: invoiceRecord?.status || "ISSUED",
      subtotal,
      taxAmount,
      totalAmount,
      shippingCost: order.shippingCost,
      createdAt: invoiceRecord?.createdAt || order.createdAt,
      issuedAt: invoiceRecord?.issuedAt || order.paidAt || order.createdAt,
      dueDate: invoiceRecord?.dueDate || null,
      companyDetails,
      customerDetails,
      items,
      order: {
        orderNumber: order.orderNumber,
        shippingCost: order.shippingCost,
        paymentMethod: order.paymentMethod || null,
        cargoCompany: order.cargoCompany
          ? { name: order.cargoCompany.name, code: order.cargoCompany.code }
          : null,
        returnRequests: (order.returnRequests || []).map((rr: any) => ({
          id: rr.id,
          status: rr.status,
          reason: rr.reason,
          refundAmount: (rr as Record<string, unknown>).refundAmount ?? null,
          createdAt: rr.createdAt,
          items: rr.items.map((ri: any) => ({
            id: ri.id,
            quantity: ri.quantity,
            orderItem: {
              productName: ri.orderItem.productName,
              colorName: ri.orderItem.colorName,
              sizeName: ri.orderItem.sizeName,
              unitPrice: ri.orderItem.unitPrice,
              totalPrice: ri.orderItem.totalPrice,
            },
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Invoice-data error", error instanceof Error ? error.message : error);
    return jsonNoStore({ error: "INVOICE_DATA_EXCEPTION" }, { status: 500 });
  }
}
