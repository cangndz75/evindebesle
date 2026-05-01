import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/policy"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.response

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      districtId: true,
      fullAddress: true,
      subscriptionPlan: true,
      isAdmin: true,
      createdAt: true,
    },
  })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.response

  const body = await req.json()
  const { name, email, phone } = body
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email zorunlu" }, { status: 400 })
  }
  const user = await prisma.user.create({ data: { name, email, phone } })
  return NextResponse.json(user)
}
