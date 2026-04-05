import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { prisma } from "@/lib/db"

function normalizePhoneInput(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("0")) return digits.slice(0, 11)
  return digits.slice(0, 10)
}

function isValidPhone(phone: string) {
  if (!phone) return true
  if (phone.startsWith("0")) return phone.length === 11
  return /^[1-9]\d{9}$/.test(phone)
}

export async function POST(req: Request) {
  const session = await getServerSession(authConfig)
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })

  const body = await req.json()

  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const phoneRaw = typeof body?.phone === "string" ? body.phone.trim() : ""
  const phone = normalizePhoneInput(phoneRaw)

  if (!name) {
    return NextResponse.json({ error: "Ad soyad zorunludur" }, { status: 400 })
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Telefon numarası 0 ile başlıyorsa 11 hane, 1-9 ile başlıyorsa 10 hane olmalıdır" },
      { status: 400 }
    )
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
