import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { resend } from "@/lib/resend";
import { renderEmailHtml, replaceVariables } from "@/lib/email/renderEmail";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId, email, blocks, subject, fromName, fromEmail, replyTo } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 });
    }

    let campaignBlocks = blocks;
    let campaignSubject = subject;
    let senderName = fromName;
    let senderEmail = fromEmail;
    let replyToEmail = replyTo;

    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (campaign) {
        campaignBlocks = campaignBlocks || JSON.parse(campaign.contentJson);
        campaignSubject = campaignSubject || campaign.subject;
        senderName = senderName || campaign.fromName;
        senderEmail = senderEmail || campaign.fromEmail;
        replyToEmail = replyToEmail || campaign.replyTo;
      }
    }

    campaignSubject = campaignSubject || "Test Email";
    senderName = senderName || "Test";
    senderEmail = senderEmail || "info@dark-velvet.com";

    if (!campaignBlocks || campaignBlocks.length === 0) {
      return NextResponse.json({ error: "No blocks to render" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dark-velvet.com";

    const html = renderEmailHtml(campaignBlocks, {
      baseUrl,
    });

    const personalizedHtml = replaceVariables(html, {
      user_name: "Test Kullanıcı",
      user_email: email,
      user_first_name: "Test",
      coupon_code: "TESTKODU",
    });

    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: email,
      subject: `[TEST] ${campaignSubject}`,
      html: personalizedHtml,
      replyTo: replyToEmail || undefined,
    });

    if (error) {
      console.error("Error sending test email:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
