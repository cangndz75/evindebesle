import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendVerificationOtpByEmail } from "@/lib/email/sendVerificationOtp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(name || "").trim();

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
    }

    if (!normalizedName || !normalizedEmail || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "Bu email adresi zaten kayıtlı." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });
    console.log("[REGISTER_SUCCESS]", newUser.id);

    let verificationEmailSent = false;
    let mailDebugError: string | null = null;
    try {
      const otpResult = await sendVerificationOtpByEmail(normalizedEmail);
      verificationEmailSent = otpResult.ok;
      if (!otpResult.ok) {
        mailDebugError = otpResult.error ?? "unknown";
        console.error("[REGISTER_OTP_MAIL]", otpResult.error);
      }
    } catch (mailErr: any) {
      mailDebugError = mailErr?.message || String(mailErr);
      console.error("[REGISTER_OTP_MAIL_EXCEPTION]", mailErr);
    }

    try {
      await prisma.analyticsEvent.create({
        data: {
          sessionId: req.headers.get('x-session-id') || 'backend-session',
          eventType: 'SIGNUP',
          eventData: {
            userId: newUser.id,
            method: 'email',
            userEmail: newUser.email,
          },
          page: '/register',
          ipAddress: ip,
          userAgent: req.headers.get('user-agent') || null,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      console.error('[ANALYTICS_TRACK_ERROR]', err);
    }

    return NextResponse.json(
      { success: true, userId: newUser.id, verificationEmailSent, mailDebugError },
      { status: 201 }
    );

  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
