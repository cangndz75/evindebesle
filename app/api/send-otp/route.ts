import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLocaleLowerCase("tr-TR");

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email gerekli." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 1000 * 60 * 10);

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #111111; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Dark Velvet</h1>
    </div>
    <h2 style="color: #333333; font-size: 20px;">Tek Kullanımlık Doğrulama Kodunuz</h2>
    <p style="color: #555555; font-size: 16px;">
      Merhaba, <br /><br />
      Aşağıdaki kod ile hesabınızı doğrulayabilirsiniz:
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111111;">${token}</span>
    </div>
    <p style="color: #555555; font-size: 14px;">
      Bu kod 10 dakika boyunca geçerlidir. Eğer bu işlemi siz başlatmadıysanız, lütfen bizimle iletişime geçin.
    </p>
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
    <p style="color: #999999; font-size: 12px; text-align: center;">
      Bu e-posta <a href="https://darkvelvet.com" style="color: #999999;">darkvelvet.com</a> üzerinden gönderilmiştir.
    </p>
  </div>
`;


    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        emailVerifyToken: token,
        emailVerifyExpires: expires,
      },
    });

    await resend.emails.send({
      from: "Dark Velvet <noreply@dark-velvet.com>",
      to: normalizedEmail,
      subject: "Doğrulama Kodunuz",
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SEND_OTP_ERROR]", error);
    return NextResponse.json({ error: "Kod gönderilemedi." }, { status: 500 });
  }
}
