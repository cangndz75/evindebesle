import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  const {
    code,
    description,
    discountType,
    value,
    maxUsage,
    expiresAt,
    isActive,
  } = await req.json()

  if (!code || !discountType || value == null) {
    return NextResponse.json(
      { error: "Kod, tür ve değer zorunludur" },
      { status: 400 }
    )
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        description,
        discountType,
        value: Number(value),
        maxUsage: maxUsage ? Number(maxUsage) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(coupon)
  } catch (err) {
    console.error("Kupon oluşturulurken hata:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(coupons)
  } catch (err) {
    console.error("Kuponlar çekilirken hata:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}