import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 1000 * 60 * 10);

  await prisma.user.update({
    where: { email },
    data: {
      emailVerifyToken: token,
      emailVerifyExpires: expires,
    },
  });

  await resend.emails.send({
    from: "Evinde Besle <onboarding@evindebesle.com>",
    to: email,
    subject: "Doğrulama Kodunuz",
    html: `<p>Doğrulama kodunuz: <strong>${token}</strong></p><p>10 dakika içinde geçerlidir.</p>`,
  });

  return NextResponse.json({ success: true });
}
