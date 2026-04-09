import "server-only";

import { prisma } from "@/lib/db";
import type { PrintOrder } from "@/lib/types/print-order";

export async function getOrderById(id: string): Promise<PrintOrder | null> {
  const order = await prisma.order.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { name: true } },
      shippingAddress: { include: { district: { select: { name: true } } } },
      items: { select: { id: true, productName: true, quantity: true } },
    },
  });

  if (!order) return null;

  const customerName = order.user?.name?.trim() || "Müşteri";
  const shippingAddress = order.shippingAddress
    ? [order.shippingAddress.fullAddress, order.shippingAddress.district?.name]
        .filter(Boolean)
        .join(", ")
    : "Teslimat adresi kayıtlı değil.";

  return {
    tracking_number: order.trackingNumber,
    customer_name: customerName,
    shipping_address: shippingAddress,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.productName,
      quantity: item.quantity,
    })),
  };
}
