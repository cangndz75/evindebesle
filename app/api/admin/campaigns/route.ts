import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      status,
      subject,
      preheader,
      fromName,
      fromEmail,
      replyTo,
      blocks,
      recipientEmails,
      audienceSegmentId,
      scheduleAt,
    } = body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        status,
        subject,
        preheader,
        fromName,
        fromEmail,
        replyTo,
        contentJson: JSON.stringify({
          blocks,
          recipientEmails: Array.isArray(recipientEmails) ? recipientEmails : [],
        }),
        audienceSegmentId,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : null,
        createdById: user.id,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    const updateData: {
      name?: string;
      status?: string;
      subject?: string;
      preheader?: string;
      fromName?: string;
      fromEmail?: string;
      replyTo?: string;
      audienceSegmentId?: string | null;
      scheduleAt?: Date | null;
      contentJson?: string;
    } = {};

    if (typeof body.name === "string") updateData.name = body.name;
    if (typeof body.status === "string") updateData.status = body.status;
    if (typeof body.subject === "string") updateData.subject = body.subject;
    if (typeof body.preheader === "string") updateData.preheader = body.preheader;
    if (typeof body.fromName === "string") updateData.fromName = body.fromName;
    if (typeof body.fromEmail === "string") updateData.fromEmail = body.fromEmail;
    if (typeof body.replyTo === "string") updateData.replyTo = body.replyTo;

    if (body.audienceSegmentId === null || typeof body.audienceSegmentId === "string") {
      updateData.audienceSegmentId = body.audienceSegmentId;
    }

    if (Object.prototype.hasOwnProperty.call(body, "scheduleAt")) {
      if (body.scheduleAt === null || body.scheduleAt === "") {
        updateData.scheduleAt = null;
      } else {
        const parsedScheduleAt = new Date(body.scheduleAt);
        if (Number.isNaN(parsedScheduleAt.getTime())) {
          return NextResponse.json({ error: "Invalid scheduleAt" }, { status: 400 });
        }
        updateData.scheduleAt = parsedScheduleAt;
      }
    }

    if (Array.isArray(body.blocks)) {
      updateData.contentJson = JSON.stringify({
        blocks: body.blocks,
        recipientEmails: Array.isArray(body.recipientEmails) ? body.recipientEmails : [],
      });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
