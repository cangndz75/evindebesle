import "server-only";

import { prisma } from "@/lib/db";
import { resend, resendFromAddress } from "@/lib/resend";

function publicBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "https://darkvelvet.com";
  if (raw.startsWith("http")) return raw.replace(/\/$/, "");
  return `https://${raw.replace(/\/$/, "")}`;
}

function buildHtml(token: string, verifyUrl: string) {
  return `
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
      Kodu girmek için: <a href="${verifyUrl}" style="color: #111111;">${verifyUrl}</a>
    </p>
    <p style="color: #555555; font-size: 14px;">
      Bu kod 10 dakika boyunca geçerlidir. Eğer bu işlemi siz başlatmadıysanız, lütfen bizimle iletişime geçin.
    </p>
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
    <p style="color: #999999; font-size: 12px; text-align: center;">
      Bu e-posta <a href="https://darkvelvet.com" style="color: #999999;">darkvelvet.com</a> üzerinden gönderilmiştir.
    </p>
  </div>
`;
}

/**
 * Kayıt ve profil doğrulaması için 6 haneli OTP üretir, DB'ye yazar ve e-posta gönderir.
 */
export async function sendVerificationOtpByEmail(normalizedEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return { ok: false as const, error: "Kullanıcı bulunamadı." };
  }

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 1000 * 60 * 10);

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      emailVerifyToken: token,
      emailVerifyExpires: expires,
    },
  });

  const verifyUrl = `${publicBaseUrl()}/verify?email=${encodeURIComponent(normalizedEmail)}`;
  const html = buildHtml(token, verifyUrl);

  const fromAddress = resendFromAddress();
  console.log("[sendVerificationOtpByEmail] Sending from:", fromAddress, "to:", normalizedEmail);

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: [normalizedEmail],
    subject: "Doğrulama Kodunuz",
    html,
  });

  if (error) {
    console.error(
      "[sendVerificationOtpByEmail] Resend error:",
      JSON.stringify(error)
    );
    return { ok: false as const, error: `E-posta gönderilemedi: ${JSON.stringify(error)}` };
  }

  console.log("[sendVerificationOtpByEmail] Success, id:", data?.id);

  return { ok: true as const };
}
