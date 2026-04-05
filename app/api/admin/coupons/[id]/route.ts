import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"
import { logAuditAction } from "@/lib/auditLog"


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
    const oldCoupon = await prisma.coupon.findUnique({ where: { id } })

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
        categoryId: body.categoryId || null,
        gender: body.gender || null,
      },
    })

    await logAuditAction({
      action: "COUPON_UPDATE",
      adminId: session.user.id,
      adminEmail: session.user.email || "",
      targetType: "Coupon",
      targetId: id,
      details: {
        oldValue: oldCoupon,
        newValue: updated,
      },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    })

    return NextResponse.json(updated)

  } catch (error) {
    console.error("PATCH /coupons/[id] error:", error)
    return NextResponse.json({ error: "GÃ¼ncelleme baÅŸarÄ±sÄ±z" }, { status: 500 })
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
    const coupon = await prisma.coupon.findUnique({ where: { id } })
    await prisma.coupon.delete({ where: { id } })

    await logAuditAction({
      action: "COUPON_DELETE",
      adminId: session.user.id,
      adminEmail: session.user.email || "",
      targetType: "Coupon",
      targetId: id,
      details: {
        deletedCoupon: coupon,
      },
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("DELETE /coupons/[id] error:", error)
    return NextResponse.json({ error: "Silme baÅŸarÄ±sÄ±z" }, { status: 500 })
  }
}
