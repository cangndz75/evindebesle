import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth-server"; 
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email ve şifre zorunludur." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return NextResponse.json({ error: "Email veya şifre hatalı." }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: "Email veya şifre hatalı." }, { status: 401 });
  }

  const session = await createSession(user); 
  return NextResponse.json({ success: true, session }, { status: 200 });
}
