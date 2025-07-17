import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { resend } from "@/lib/resend"
import { generateResetPasswordEmailHtml } from "@/lib/email/templates/reset-password-template"

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Geçersiz e-posta." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ error: "Bu e-posta sistemimizde kayıtlı değildir." }, { status: 404 })
  }

  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 1000 * 60 * 60) 

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: expires,
    },
  })

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: "EvindeBesle <noreply@evindebesle.com>",
    to: [user.email],
    subject: "Şifre Sıfırlama Talebi",
    html: generateResetPasswordEmailHtml({
      name: user.name,
      resetUrl,
    }),
  })

  return NextResponse.json({ success: true })
}
