import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import { sendVerificationOtpByEmail } from "@/lib/email/sendVerificationOtp";

export async function POST() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  if (!dbUser?.email) {
    return NextResponse.json({ error: "Kayıtlı e-posta bulunamadı." }, { status: 400 });
  }

  if (dbUser.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  const result = await sendVerificationOtpByEmail(dbUser.email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
