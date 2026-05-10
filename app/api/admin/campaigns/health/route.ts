import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getCampaignCronHeartbeat } from "@/lib/campaigns/cronHealth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const [pendingScheduledCount, overdueScheduledCount, nextScheduledCampaign, failedCampaignsRaw, recentlySentScheduled] = await Promise.all([
      prisma.campaign.count({
        where: {
          status: "scheduled",
          scheduleAt: { gt: now },
        },
      }),
      prisma.campaign.count({
        where: {
          status: "scheduled",
          scheduleAt: { lte: now },
        },
      }),
      prisma.campaign.findFirst({
        where: {
          status: "scheduled",
          scheduleAt: { gt: now },
        },
        orderBy: { scheduleAt: "asc" },
        select: {
          id: true,
          name: true,
          scheduleAt: true,
        },
      }),
      prisma.campaign.findMany({
        where: {
          emailSends: {
            some: {
              status: "failed",
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          status: true,
          sentAt: true,
          _count: {
            select: {
              emailSends: true,
            },
          },
          emailSends: {
            where: { status: "failed" },
            select: { id: true },
          },
        },
      }),
      prisma.campaign.findFirst({
        where: {
          status: "sent",
          scheduleAt: { not: null },
          sentAt: { not: null },
        },
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          name: true,
          scheduleAt: true,
          sentAt: true,
        },
      }),
    ]);

    const failedCampaigns = failedCampaignsRaw.map(
      (campaign: {
        id: string;
        name: string;
        status: string;
        sentAt: Date | null;
        _count: { emailSends: number };
        emailSends: Array<{ id: string }>;
      }) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      sentAt: campaign.sentAt,
      failedCount: campaign.emailSends.length,
      totalSendCount: campaign._count.emailSends,
      }),
    );

    return NextResponse.json({
      pendingScheduledCount,
      overdueScheduledCount,
      nextScheduledCampaign,
      failedCampaigns,
      lastCronRunAt: getCampaignCronHeartbeat(),
      lastSuccessfullySentScheduledCampaign: recentlySentScheduled,
    });
  } catch (error) {
    console.error("Error getting campaign health:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
