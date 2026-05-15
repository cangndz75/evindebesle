import "server-only";

import { prisma } from "@/lib/db";

const DEFAULT_SHIPPING_PRICE = 49.9;
const DEFAULT_FREE_SHIPPING_THRESHOLD = 99.0;

export async function calculateShippingCost(subtotal: number): Promise<number> {
  const settings = await prisma.companySettings.findFirst({
    select: {
      freeShippingThreshold: true,
      shippingPrice: true,
    },
  });

  const threshold =
    settings?.freeShippingThreshold ?? DEFAULT_FREE_SHIPPING_THRESHOLD;
  const price = settings?.shippingPrice ?? DEFAULT_SHIPPING_PRICE;

  if (subtotal >= threshold) return 0;
  return Number(price);
}
