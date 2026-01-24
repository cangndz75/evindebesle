import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Tüm kampanyaları listele
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

// POST: Yeni kampanya oluştur
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
      audienceSegmentId,
      scheduleAt,
    } = body;

    // Prisma schema'da Campaign modeli olmalı
    // Şimdilik basit bir JSON storage kullanıyoruz
    const campaign = await prisma.campaign.create({
      data: {
        name,
        status,
        subject,
        preheader,
        fromName,
        fromEmail,
        replyTo,
        contentJson: JSON.stringify(blocks),
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

// PUT: Kampanya güncelle
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...updates,
        contentJson: updates.blocks ? JSON.stringify(updates.blocks) : undefined,
        scheduleAt: updates.scheduleAt ? new Date(updates.scheduleAt) : undefined,
      },
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
