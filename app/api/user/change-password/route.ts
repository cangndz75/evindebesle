import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

  const { current, next } = await req.json()

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || !user.password) return NextResponse.json({}, { status: 400 })

  const isValid = await bcrypt.compare(current, user.password)
  if (!isValid) return NextResponse.json({ error: "Şifre yanlış" }, { status: 401 })

  const hashed = await bcrypt.hash(next, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true })
}
