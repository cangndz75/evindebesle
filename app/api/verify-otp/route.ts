import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const { email, code } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    user.emailVerifyToken !== code ||
    !user.emailVerifyExpires ||
    new Date() > user.emailVerifyExpires
  ) {
    return NextResponse.json({ error: "Kod geçersiz veya süresi dolmuş." }, { status: 400 });
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  return NextResponse.json({ success: true });
}
