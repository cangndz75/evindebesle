import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { verifyAdminMfaLogin } from "@/lib/security/admin-mfa";

export async function POST(req: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const code = String(body.code || "").trim();

  if (!code || code.length < 6) {
    return NextResponse.json({ error: "Geçersiz doğrulama kodu." }, { status: 400 });
  }

  const result = await verifyAdminMfaLogin(session.user.id, code);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason === "INVALID_OTP" ? "Doğrulama kodu hatalı." : "MFA yapılandırması bulunamadı." },
      { status: 401 },
    );
  }

  return NextResponse.json({ verified: true });
}
