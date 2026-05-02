import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAdminNotification } from "@/lib/notifications/createAdminNotification";

export async function POST(req: Request) {
  const { email, code } = await req.json();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (
    !user ||
    user.emailVerifyToken !== code ||
    !user.emailVerifyExpires ||
    new Date() > user.emailVerifyExpires
  ) {
    return NextResponse.json({ error: "Kod geçersiz veya süresi dolmuş." }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });

  if (!user.emailVerified) {
    await createAdminNotification({
      type: "NEW_USER",
      userId: user.id,
      message: `Yeni kullanıcı kaydı doğrulandı: ${user.name} (${user.email})`,
    });
  }

  return NextResponse.json({ success: true });
}
