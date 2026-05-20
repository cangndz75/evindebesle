import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db";
import { logAuditAction } from "@/lib/auditLog";
import type { Prisma } from "@prisma/client";
import { parseDiscountTiers } from "@/lib/campaign-banner";
import { toAdminCampaignBanner } from "@/lib/campaign-banner.server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.campaignBanner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kampanya bulunamadı" }, { status: 404 });
    }

    const tiers = parseDiscountTiers(existing.discountTiers);
    if (tiers.length === 0) {
      return NextResponse.json(
        { error: "En az bir indirim kademesi olmadan yayına alınamaz" },
        { status: 400 }
      );
    }

    const row = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.campaignBanner.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });

      return tx.campaignBanner.update({
        where: { id },
        data: { isActive: true },
      });
    });

    await logAuditAction({
      action: "UPDATE",
      adminId: user.id,
      adminEmail: user.email || "",
      targetType: "CampaignBanner",
      targetId: row.id,
      details: { action: "activate", oldValue: existing, newValue: row },
      ipAddress: _request.headers.get("x-forwarded-for") || undefined,
      userAgent: _request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(toAdminCampaignBanner(row));
  } catch (error) {
    console.error("Error activating campaign banner:", error);
    return NextResponse.json({ error: "Yayına alınamadı" }, { status: 500 });
  }
}
