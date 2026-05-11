import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { disableAdminMfa } from "@/lib/security/admin-mfa";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  const userId = typeof token?.sub === "string" ? token.sub : null;

  if (!userId || !token?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await disableAdminMfa(userId);
  return NextResponse.json({ ok: true });
}
