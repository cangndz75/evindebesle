import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { deactivateExpiredCoupons } from "@/lib/coupons/deactivateExpiredCoupons";
import { z } from "zod";

type UserCouponWithCoupon = Prisma.UserCouponGetPayload<{
  include: { coupon: true };
}>;

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kupon kodu gerekli")
    .max(64, "Kupon kodu çok uzun"),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const userId = session.user.id;

  await deactivateExpiredCoupons();

  const userCoupons = await prisma.userCoupon.findMany({
    where: { userId },
    include: { coupon: true },
    orderBy: { id: "desc" },
  });

  const result = userCoupons.map((uc: UserCouponWithCoupon) => {
    const c = uc.coupon;
    const usedAt = uc.usedAt;
    const isExpired = c.expiresAt ? c.expiresAt < now : false;
    const isUsable = !usedAt && c.isActive && !isExpired;

    return {
      id: uc.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      value: c.value,
      isActive: c.isActive,
      expiresAt: c.expiresAt,
      usedAt,
      isUsable,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Geçersiz kupon kodu.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const userId = session.user.id;
  const codeInput = parsed.data.code;

  await deactivateExpiredCoupons();

  const coupon = await prisma.coupon.findFirst({
    where: {
      code: { equals: codeInput, mode: "insensitive" },
    },
  });

  if (!coupon) {
    return NextResponse.json({ error: "Kupon bulunamadı." }, { status: 404 });
  }

  if (!coupon.isActive) {
    return NextResponse.json({ error: "Bu kupon şu anda aktif değil." }, { status: 400 });
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Kupon süresi dolmuş." }, { status: 400 });
  }

  const existingLink = await prisma.userCoupon.findFirst({
    where: {
      userId,
      couponId: coupon.id,
    },
  });

  if (existingLink) {
    if (existingLink.usedAt) {
      return NextResponse.json({ error: "Bu kuponu zaten kullandınız." }, { status: 400 });
    }
    return NextResponse.json({ error: "Bu kupon zaten hesabınıza tanımlı." }, { status: 400 });
  }

  await prisma.userCoupon.create({
    data: {
      userId,
      couponId: coupon.id,
    },
  });

  return NextResponse.json({ success: true });
}
