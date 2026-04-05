import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const campaignId = url.searchParams.get("id");

        if (!campaignId) {
            return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
        }

        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                emailSends: {
                    orderBy: { createdAt: "desc" },
                },
                emailLinks: {
                    orderBy: { clickCount: "desc" },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const totalSent = campaign.emailSends.filter((s: any) => s.status === "sent").length;
        const totalOpened = campaign.emailSends.filter((s: any) => s.openedAt !== null).length;
        const totalClicked = campaign.emailSends.filter((s: any) => s.clickedAt !== null).length;
        const totalFailed = campaign.emailSends.filter((s: any) => s.status === "failed").length;
        const totalBounced = campaign.emailSends.filter((s: any) => s.status === "bounced").length;

        const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
        const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
        const clickToSendRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

        const events = await prisma.emailEvent.findMany({
            where: {
                emailSend: {
                    campaignId,
                },
            },
            orderBy: { createdAt: "asc" },
        });

        const timelineMap = new Map<string, { opens: number; clicks: number }>();
        events.forEach((event: any) => {
            const hour = new Date(event.createdAt).toISOString().slice(0, 13); // YYYY-MM-DDTHH
            if (!timelineMap.has(hour)) {
                timelineMap.set(hour, { opens: 0, clicks: 0 });
            }
            const data = timelineMap.get(hour)!;
            if (event.type === "open") data.opens++;
            if (event.type === "click") data.clicks++;
        });

        const timeline = Array.from(timelineMap.entries()).map(([hour, data]: [string, any]) => ({
            time: hour,
            opens: data.opens,
            clicks: data.clicks,
        }));

        const recipients = campaign.emailSends.map((send: any) => ({
            id: send.id,
            email: send.email,
            status: send.status,
            sentAt: send.sentAt,
            openedAt: send.openedAt,
            clickedAt: send.clickedAt,
        }));

        const links = campaign.emailLinks.map((link: any) => ({
            id: link.id,
            url: link.originalUrl,
            clicks: link.clickCount,
        }));

        return NextResponse.json({
            campaign: {
                id: campaign.id,
                name: campaign.name,
                subject: campaign.subject,
                status: campaign.status,
                sentAt: campaign.sentAt,
                createdAt: campaign.createdAt,
            },
            stats: {
                totalSent,
                totalOpened,
                totalClicked,
                totalFailed,
                totalBounced,
                openRate: Math.round(openRate * 100) / 100,
                clickRate: Math.round(clickRate * 100) / 100,
                clickToSendRate: Math.round(clickToSendRate * 100) / 100,
            },
            timeline,
            recipients,
            links,
        });
    } catch (error) {
        console.error("Error fetching campaign analytics:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
