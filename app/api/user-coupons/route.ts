import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const userId = session.user.id;

  const userCoupons = await prisma.userCoupon.findMany({
    where: { userId },
    include: { coupon: true },
  });

  const result = await Promise.all(
    userCoupons.map(async (uc) => {
      const c = uc.coupon;

      const used = await prisma.appointment.findFirst({
        where: {
          userId,
          couponId: c.id,
          isPaid: true,
        },
        select: { confirmedAt: true },
      });

      const usedAt = used?.confirmedAt || null;
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
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz kupon kodu." }, { status: 400 });
  }

  const { code } = parsed.data;
  const userId = session.user.id;

  const coupon = await prisma.coupon.findUnique({
    where: { code },
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

  const alreadyUsed = await prisma.appointment.findFirst({
    where: {
      userId,
      couponId: coupon.id,
      isPaid: true,
    },
  });

  if (alreadyUsed) {
    return NextResponse.json({ error: "Bu kuponu zaten kullandınız." }, { status: 400 });
  }

  const alreadyAssigned = await prisma.userCoupon.findFirst({
    where: {
      userId,
      couponId: coupon.id,
    },
  });

  if (alreadyAssigned) {
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
