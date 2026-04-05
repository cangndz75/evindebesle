import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;
    const normalizedEmail = String(email || "").trim().toLocaleLowerCase("tr-TR");
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

    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: req.headers.get('x-session-id') || 'backend-session',
          eventType: 'SIGNUP',
          eventData: {
            userId: newUser.id,
            method: 'email',
            userEmail: newUser.email,
          },
          page: '/register',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('[ANALYTICS_TRACK_ERROR]', err);
    }

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });

  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
