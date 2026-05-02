import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rateLimit";
import { prisma } from "@/lib/db"
import { resend, resendFromAddress } from "@/lib/resend"
import { generateResetPasswordEmailHtml } from "@/lib/email/templates/reset-password-template"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Geçersiz e-posta." }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json({ error: "Geçersiz e-posta." }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    })

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

    const baseUrl = process.env.FRONTEND_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://dark-velvet.com";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`
    const { error } = await resend.emails.send({
      from: resendFromAddress(),
      to: [user.email],
      subject: "Şifre Sıfırlama Talebi",
      html: generateResetPasswordEmailHtml({
        name: user.name,
        resetUrl,
      }),
    })

    if (error) {
      console.error("[FORGOT_PASSWORD_EMAIL_ERROR]", error);
      return NextResponse.json({ error: "Şifre sıfırlama e-postası gönderilemedi." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 })
  }
}
