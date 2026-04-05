import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/db"
import { resend } from "@/lib/resend"
import { generateResetPasswordEmailHtml } from "@/lib/email/templates/reset-password-template"

export async function POST(req: Request) {
  const { email } = await req.json()

  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const { success } = await rateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Geçersiz e-posta." }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ success: true })
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  })

  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: expires,
    },
  })

  const resetUrl = `${process.env.FRONTEND_BASE_URL}/reset-password?token=${token}`

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
