import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { resend } from "@/lib/resend";
import { renderEmailHtml, replaceVariables } from "@/lib/email/renderEmail";

// POST: Test email gönder
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

    // If campaignId provided, get campaign from DB for fallbacks
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

    // Default fallbacks
    campaignSubject = campaignSubject || "Test Email";
    senderName = senderName || "Test";
    senderEmail = senderEmail || "onboarding@resend.dev";

    if (!campaignBlocks || campaignBlocks.length === 0) {
      return NextResponse.json({ error: "No blocks to render" }, { status: 400 });
    }

    // Base URL for tracking (not used in test emails)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

    // Render HTML without tracking for test emails
    const html = renderEmailHtml(campaignBlocks, {
      baseUrl,
      // No trackingId - this is just a test
    });

    // Replace variables with test values
    const personalizedHtml = replaceVariables(html, {
      user_name: "Test Kullanıcı",
      user_email: email,
      user_first_name: "Test",
      coupon_code: "TESTKODU",
    });

    // Send test email via Resend
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
