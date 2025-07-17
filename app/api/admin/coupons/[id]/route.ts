import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authConfig)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  const body = await req.json()

  try {
    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        code: body.code,
        description: body.description,
        discountType: body.discountType,
        value: Number(body.value),
        maxUsage: body.maxUsage ? Number(body.maxUsage) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PATCH /coupons/[id] error:", error)
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authConfig)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  try {
    await prisma.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /coupons/[id] error:", error)
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 })
  }
}
