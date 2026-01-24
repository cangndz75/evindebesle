import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
// import { sendEmail } from "@/lib/resend"; // Email gönderim fonksiyonu

// POST: Test e-postası gönder
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId, email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // TODO: Kampanyayı yükle ve render et
    // TODO: Email gönder
    // await sendEmail({
    //   to: email,
    //   subject: "Test Email",
    //   html: "<p>Test</p>",
    // });

    return NextResponse.json({ success: true, message: "Test email sent" });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
