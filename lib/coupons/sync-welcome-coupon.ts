import { prisma } from "@/lib/db";

/** Hoş geldin popup ile oluşturulan kuponu, aynı e-postalı giriş yapmış kullanıcıya bağlar */
export async function syncWelcomeCouponForUser(
  userId: string,
  email: string | null | undefined
) {
  if (!email) return;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const subscriber = await prisma.subscriber.findUnique({
    where: { email: normalizedEmail },
    select: { welcomeCouponId: true },
  });

  if (!subscriber?.welcomeCouponId) return;

  const existing = await prisma.userCoupon.findFirst({
    where: { userId, couponId: subscriber.welcomeCouponId },
  });

  if (!existing) {
    await prisma.userCoupon.create({
      data: {
        userId,
        couponId: subscriber.welcomeCouponId,
      },
    });
  }
}
