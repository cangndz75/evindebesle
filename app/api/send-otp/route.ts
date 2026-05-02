import { NextResponse } from "next/server";
import { sendVerificationOtpByEmail } from "@/lib/email/sendVerificationOtp";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email gerekli." }, { status: 400 });
    }

    const result = await sendVerificationOtpByEmail(normalizedEmail);
    if (!result.ok) {
      const status = result.error === "Kullanıcı bulunamadı." ? 404 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SEND_OTP_ERROR]", error);
    return NextResponse.json({ error: "Kod gönderilemedi." }, { status: 500 });
  }
}
