import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminMfaStatus } from "@/lib/security/admin-mfa";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  const userId = typeof token?.sub === "string" ? token.sub : null;

  if (!userId || !token?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = await getAdminMfaStatus(userId);
  if (!status) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(status);
}
