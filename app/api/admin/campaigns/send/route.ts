import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { resend } from "@/lib/resend";
import { renderEmailHtml, replaceVariables } from "@/lib/email/renderEmail";

// POST: Kampanyayı gönder
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id: campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    // Get campaign from database
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Parse blocks from contentJson
    const blocks = JSON.parse(campaign.contentJson);

    // Get recipients based on audience segment
    const recipients = await getRecipients(campaign.audienceSegmentId);

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    // Base URL for tracking
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://evindebesle.com";

    let sentCount = 0;
    const errors: string[] = [];

    // Send to each recipient with rate limiting
    for (const recipient of recipients) {
      try {
        // Create email send record first
        const emailSend = await prisma.emailSend.create({
          data: {
            campaignId: campaign.id,
            userId: recipient.id,
            email: recipient.email,
            status: "pending",
          },
        });

        // Render HTML with tracking
        const html = renderEmailHtml(blocks, {
          baseUrl,
          trackingId: emailSend.trackingId,
          campaignId: campaign.id,
        });

        // Replace personalization variables
        const personalizedHtml = replaceVariables(html, {
          user_name: recipient.name || "Değerli Müşterimiz",
          user_email: recipient.email,
          user_first_name: recipient.name?.split(" ")[0] || "Değerli Müşterimiz",
        });

        // Send email via Resend
        const { error } = await resend.emails.send({
          from: `${campaign.fromName} <${campaign.fromEmail}>`,
          to: recipient.email,
          subject: campaign.subject,
          html: personalizedHtml,
          replyTo: campaign.replyTo || undefined,
          headers: {
            "X-Campaign-ID": campaign.id,
            "X-Tracking-ID": emailSend.trackingId,
          },
        });

        if (error) {
          console.error(`Error sending to ${recipient.email}:`, error);
          await prisma.emailSend.update({
            where: { id: emailSend.id },
            data: { status: "failed" },
          });
          errors.push(`${recipient.email}: ${error.message}`);
        } else {
          await prisma.emailSend.update({
            where: { id: emailSend.id },
            data: {
              status: "sent",
              sentAt: new Date(),
            },
          });
          sentCount++;
        }

        // Rate limiting: wait 100ms between sends
        await new Promise((resolve) => setTimeout(resolve, 100));

      } catch (recipientError) {
        console.error(`Error processing ${recipient.email}:`, recipientError);
        errors.push(`${recipient.email}: Processing error`);
      }
    }

    // Update campaign
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "sent",
        sentAt: new Date(),
        sentCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign sent",
      sentCount,
      totalRecipients: recipients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getRecipients(segmentId: string | null) {
  // Build where clause based on segment
  const where: Record<string, unknown> = {
    emailVerified: true,
    marketingEmailConsent: true,
  };

  if (segmentId === "active") {
    // Users with orders in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.user.findMany({
      where: {
        ...where,
        orders: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  if (segmentId === "inactive") {
    // Users without orders in last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return prisma.user.findMany({
      where: {
        ...where,
        OR: [
          { orders: { none: {} } },
          {
            orders: {
              every: {
                createdAt: { lt: ninetyDaysAgo },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  // Default: all users with marketing consent
  return prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}
