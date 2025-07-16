import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function POST(req: Request) {
  const body = await req.json();
  const { to, subject, html } = body;

  try {
    const data = await resend.emails.send({
      from: "Evinde Besle <info@evindebesle.com>",
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "Email gönderilemedi", detail: error }, { status: 500 });
  }
}
