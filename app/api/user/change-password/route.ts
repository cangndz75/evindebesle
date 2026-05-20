import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { changePasswordApiSchema, getZodErrorMessage } from "@/lib/validation/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = changePasswordApiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(parsed.error) },
        { status: 400 }
      );
    }

    const { current, next } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) {
      return NextResponse.json({ error: "Şifre güncellenemedi." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(current, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Mevcut şifre yanlış." }, { status: 401 });
    }

    const hashed = await bcrypt.hash(next, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHANGE_PASSWORD_ERROR]", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
