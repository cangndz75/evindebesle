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
    const { id: campaignId, recipientEmail } = body;

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

    let recipients: any[] = [];

    // If recipient email is provided (Single Send), use it
    if (recipientEmail) {
      // Try to find user in DB to get name, otherwise use email as name base
      const user = await prisma.user.findUnique({
        where: { email: recipientEmail },
        select: { id: true, name: true, email: true },
      });

      if (user) {
        recipients = [user];
      } else {
        // ID is required for tracking, use a placeholder or check if subscriber exists
        const subscriber = await prisma.subscriber.findUnique({
          where: { email: recipientEmail },
        });

        recipients = [{
          id: subscriber?.id || `anon-${Date.now()}`,
          email: recipientEmail,
          name: recipientEmail.split("@")[0],
        }];
      }
    } else {
      // Bulk send based on segment
      recipients = await getRecipients(campaign.audienceSegmentId);
    }

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
          coupon_code: "HOŞGELDİN", // Default or you can add logic to fetch specific coupon
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
  // Common selection for both types
  const userSelect = {
    id: true,
    email: true,
    name: true,
  };

  const subscriberSelect = {
    id: true,
    email: true,
    // Subscriber doesn't have a name, default to email or null
  };

  let users: any[] = [];
  let anonymousSubscribers: any[] = [];

  // Build where clause for users
  const userWhere: Record<string, any> = {
    marketingEmailConsent: true,
    // emailVerified: true, // Only if you strictly want verified
  };

  if (segmentId === "active") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    users = await prisma.user.findMany({
      where: {
        ...userWhere,
        orders: { some: { createdAt: { gte: thirtyDaysAgo } } },
      },
      select: userSelect,
    });
  } else if (segmentId === "inactive") {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    users = await prisma.user.findMany({
      where: {
        ...userWhere,
        OR: [
          { orders: { none: {} } },
          { orders: { every: { createdAt: { lt: ninetyDaysAgo } } } },
        ],
      },
      select: userSelect,
    });
  } else if (segmentId === "newsletter" || !segmentId) {
    // Both users and anonymous subscribers
    users = await prisma.user.findMany({
      where: userWhere,
      select: userSelect,
    });
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
    });
    anonymousSubscribers = subscribers.map((s: any) => ({
      id: s.id,
      email: s.email,
      name: s.email.split("@")[0], // Fallback name
    }));
  }

  // Combine and de-duplicate by email
  const allRecipients = [...users, ...anonymousSubscribers];
  const uniqueRecipients = Array.from(new Map(allRecipients.map((r: any) => [r.email, r])).values());

  return uniqueRecipients;
}
