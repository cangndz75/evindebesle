import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { enableAdminMfa } from "@/lib/security/admin-mfa";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  const userId = typeof token?.sub === "string" ? token.sub : null;

  if (!userId || !token?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const otp = typeof body?.otp === "string" ? body.otp : "";

  const result = await enableAdminMfa(userId, otp);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    backupCodes: result.backupCodes,
    message: "MFA aktif edildi. Yedek kodları güvenli bir yere kaydedin.",
  });
}
