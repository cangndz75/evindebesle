import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { setupAdminMfa } from "@/lib/security/admin-mfa";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  const userId = typeof token?.sub === "string" ? token.sub : null;

  if (!userId || !token?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, isAdmin: true },
  });

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await setupAdminMfa(userId, user.email);
  return NextResponse.json(result);
}
