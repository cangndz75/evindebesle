import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { requireAdmin } from "@/lib/api/policy";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const body = await req.json();
  const { to, subject, html } = body;

  if (!to || !subject || !html) {
    return NextResponse.json({ error: "Eksik parametreler" }, { status: 400 });
  }

  try {
    const data = await resend.emails.send({
      from: "Dark Velvet <info@dark-velvet.com>",
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "Email gönderilemedi" }, { status: 500 });
  }
}
