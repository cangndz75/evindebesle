import "server-only";

import { decryptPiiIfNeeded } from "@/lib/security/at-rest-crypto";

type AnyRecord = Record<string, any>;

function resolveOrderItemImage(item: AnyRecord) {
  if (item.image) return item.image;

  const rawColorImages = item.color?.images;
  if (rawColorImages) {
    try {
      const parsed = typeof rawColorImages === "string" ? JSON.parse(rawColorImages) : rawColorImages;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0] ?? null;
      }
      if (typeof parsed === "string" && parsed.trim()) {
        return parsed;
      }
    } catch {
      if (typeof rawColorImages === "string" && rawColorImages.trim()) {
        return rawColorImages;
      }
    }
  }

  return item.product?.primaryImage ?? item.product?.image ?? null;
}

export function toOrderListDTO(order: AnyRecord) {
  const latestInvoice = Array.isArray(order.invoices) && order.invoices.length > 0 ? order.invoices[0] : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber ?? null,
    items: (order.items || []).map((item: AnyRecord) => ({
      id: item.id,
      productName: item.productName,
      colorName: item.colorName ?? item.color?.name ?? null,
      sizeName: item.sizeName ?? item.size?.name ?? null,
      quantity: item.quantity,
      image: resolveOrderItemImage(item),
      product: {
        id: item.product?.id,
        name: item.product?.name,
        image: item.product?.primaryImage ?? item.product?.image ?? null,
        slug: item.product?.slug ?? null,
      },
    })),
    shippingAddress: order.shippingAddress
      ? {
          fullAddress: decryptPiiIfNeeded(order.shippingAddress.fullAddress),
          district: {
            name: order.shippingAddress.district?.name,
          },
        }
      : null,
    invoice: latestInvoice
      ? {
          id: latestInvoice.id,
          invoiceNumber: latestInvoice.invoiceNumber,
          createdAt: latestInvoice.createdAt,
        }
      : null,
  };
}

export function toOrderDetailDTO(order: AnyRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    discount: order.discount,
    currency: order.currency,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber ?? null,
    paymentMethod: order.payment?.provider ?? null,
    items: (order.items || []).map((item: AnyRecord) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      image: resolveOrderItemImage(item),
      colorName: item.colorName ?? item.color?.name ?? null,
      sizeName: item.sizeName ?? item.size?.name ?? null,
      product: {
        id: item.product?.id,
        name: item.product?.name,
        slug: item.product?.slug ?? null,
        image: item.product?.primaryImage ?? item.product?.image ?? null,
      },
      color: item.color ? { name: item.color.name } : null,
      size: item.size ? { name: item.size.name } : null,
    })),
    shippingAddress: order.shippingAddress
      ? {
          fullAddress: decryptPiiIfNeeded(order.shippingAddress.fullAddress),
          district: {
            name: order.shippingAddress.district?.name,
            city: order.shippingAddress.district?.city,
          },
        }
      : null,
    billingAddress: order.billingAddress
      ? {
          fullAddress: decryptPiiIfNeeded(order.billingAddress.fullAddress),
          district: {
            name: order.billingAddress.district?.name,
            city: order.billingAddress.district?.city,
          },
        }
      : null,
    coupon: order.coupon
      ? {
          code: order.coupon.code,
          discountType: order.coupon.discountType,
          value: order.coupon.value,
        }
      : null,
    user: {
      fullAddress: order.user?.fullAddress ? decryptPiiIfNeeded(order.user.fullAddress) : null,
      district: order.user?.district
        ? {
            name: order.user.district.name,
            city: order.user.district.city,
          }
        : null,
    },
  };
}

export function toInvoiceDTO(order: AnyRecord) {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? null,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    discount: order.discount,
    total: order.total,
    trackingNumber: order.trackingNumber ?? null,
    items: (order.items || []).map((item: AnyRecord) => ({
      productName: item.productName,
      colorName: item.colorName ?? item.color?.name ?? null,
      sizeName: item.sizeName ?? item.size?.name ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    user: {
      name: order.user?.name ?? "",
      email: order.user?.email ?? "",
    },
    billingAddress: order.billingAddress
      ? {
          fullAddress: decryptPiiIfNeeded(order.billingAddress.fullAddress),
          district: {
            name: order.billingAddress.district?.name,
            city: order.billingAddress.district?.city,
          },
        }
      : null,
    shippingAddress: order.shippingAddress
      ? {
          fullAddress: decryptPiiIfNeeded(order.shippingAddress.fullAddress),
          district: {
            name: order.shippingAddress.district?.name,
            city: order.shippingAddress.district?.city,
          },
        }
      : null,
  };
}
