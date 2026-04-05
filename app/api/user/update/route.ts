import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

  const body = await req.json()

  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const phone = typeof body?.phone === "string" ? body.phone.trim() : ""

  if (!name) {
    return NextResponse.json({ error: "Ad soyad zorunludur" }, { status: 400 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone,
    },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  })

  return NextResponse.json({ success: true, user: updatedUser })
}
