import "server-only";

import { prisma } from "@/lib/db";

/**
 * Son kullanma tarihi geçmiş ve hâlâ aktif görünen kuponları pasife alır.
 * expiresAt null olan kuponlara dokunmaz (süresiz).
 */
export async function deactivateExpiredCoupons(): Promise<number> {
  const now = new Date();
  const result = await prisma.coupon.updateMany({
    where: {
      isActive: true,
      expiresAt: { lt: now },
    },
    data: { isActive: false },
  });
  return result.count;
}
