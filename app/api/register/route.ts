import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAdminNotification } from "@/lib/notifications/createAdminNotification";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Bu email adresi zaten kayıtlı." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    await createAdminNotification({
      type: "NEW_USER",
      userId: newUser.id,
      message: `Yeni kullanıcı kaydı: ${newUser.name} (${newUser.email})`,
    });
    console.log("[REGISTER_SUCCESS]", newUser.id);

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });

  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
