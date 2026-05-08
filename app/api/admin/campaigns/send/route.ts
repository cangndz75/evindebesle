import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { sendCampaignNow } from "@/lib/campaigns/sendCampaign";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id: campaignId, recipientEmail, recipientEmails, scheduleAt, blocks } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const parsedScheduleAt = scheduleAt ? new Date(scheduleAt) : campaign.scheduleAt;
    if (scheduleAt && Number.isNaN(parsedScheduleAt.getTime())) {
      return NextResponse.json({ error: "Invalid scheduleAt" }, { status: 400 });
    }

    if (parsedScheduleAt && !Number.isNaN(parsedScheduleAt.getTime()) && parsedScheduleAt > new Date()) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: "scheduled",
          scheduleAt: parsedScheduleAt,
          contentJson: Array.isArray(blocks)
            ? JSON.stringify({
                blocks,
                recipientEmails: Array.isArray(recipientEmails) ? recipientEmails : [],
              })
            : undefined,
        },
      });

      return NextResponse.json({
        success: true,
        scheduled: true,
        message: "Campaign scheduled",
        scheduleAt: parsedScheduleAt,
      });
    }

    const result = await sendCampaignNow({
      campaignId: campaign.id,
      recipientEmail,
      recipientEmails,
    });

    return NextResponse.json({
      success: true,
      message: "Campaign sent",
      sentCount: result.sentCount,
      totalRecipients: result.totalRecipients,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
