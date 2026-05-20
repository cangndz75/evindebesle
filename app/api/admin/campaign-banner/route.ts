import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/auditLog";
import {
  DEFAULT_CAMPAIGN_BANNER,
  normalizeDiscountTiersFromBody,
  parseOptionalDate,
  toAdminCampaignBanner,
} from "@/lib/campaign-banner";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.campaignBanner.findMany({
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({
      campaigns: rows.map((row) => toAdminCampaignBanner(row)),
    });
  } catch (error) {
    console.error("Error listing campaign banners:", error);
    return NextResponse.json({ error: "Liste yüklenemedi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : DEFAULT_CAMPAIGN_BANNER.name;

    const row = await prisma.campaignBanner.create({
      data: {
        name,
        isActive: false,
        badgeText: DEFAULT_CAMPAIGN_BANNER.badgeText,
        title: DEFAULT_CAMPAIGN_BANNER.title,
        description: DEFAULT_CAMPAIGN_BANNER.description,
        buttonText: DEFAULT_CAMPAIGN_BANNER.buttonText,
        buttonUrl: DEFAULT_CAMPAIGN_BANNER.buttonUrl,
        subNote: DEFAULT_CAMPAIGN_BANNER.subNote,
        discountTiers: DEFAULT_CAMPAIGN_BANNER.discountTiers,
        themeColor: DEFAULT_CAMPAIGN_BANNER.themeColor,
      },
    });

    await logAuditAction({
      action: "CREATE",
      adminId: user.id,
      adminEmail: user.email || "",
      targetType: "CampaignBanner",
      targetId: row.id,
      details: { newValue: row },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(toAdminCampaignBanner(row), { status: 201 });
  } catch (error) {
    console.error("Error creating campaign banner:", error);
    return NextResponse.json({ error: "Kampanya oluşturulamadı" }, { status: 500 });
  }
}
