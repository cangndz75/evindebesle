import "server-only";

import { prisma } from "@/lib/db";
import type { CampaignBanner, Prisma } from "@prisma/client";
import {
  DEFAULT_CAMPAIGN_BANNER,
  getCampaignStatus,
  isCampaignLive,
  parseDiscountTiers,
  type CampaignBannerAdmin,
  type CampaignBannerPublic,
} from "@/lib/campaign-banner";

export function toPublicCampaignBanner(
  row: CampaignBanner | null | undefined
): CampaignBannerPublic {
  if (!row) {
    return {
      isActive: false,
      ...DEFAULT_CAMPAIGN_BANNER,
    };
  }

  const tiers = parseDiscountTiers(row.discountTiers);

  return {
    isActive: row.isActive,
    badgeText: row.badgeText,
    title: row.title,
    description: row.description,
    buttonText: row.buttonText,
    buttonUrl: row.buttonUrl,
    subNote: row.subNote,
    discountTiers:
      tiers.length > 0 ? tiers : DEFAULT_CAMPAIGN_BANNER.discountTiers,
    themeColor: row.themeColor || "olive",
  };
}

export function toAdminCampaignBanner(
  row: CampaignBanner,
  now: Date = new Date()
): CampaignBannerAdmin {
  return {
    id: row.id,
    name: row.name,
    ...toPublicCampaignBanner(row),
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    status: getCampaignStatus(row, now),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function activeCampaignWhere(now: Date = new Date()) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  } satisfies Prisma.CampaignBannerWhereInput;
}

export async function getActiveCampaignBanner(): Promise<CampaignBannerPublic | null> {
  try {
    const now = new Date();
    const row = await prisma.campaignBanner.findFirst({
      where: activeCampaignWhere(now),
      orderBy: { updatedAt: "desc" },
    });
    if (!row || !isCampaignLive(row, now)) return null;
    return toPublicCampaignBanner(row);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "P2021") return null;
    console.error("getActiveCampaignBanner:", error);
    return null;
  }
}

export async function deactivateOtherCampaigns(
  exceptId: string
): Promise<void> {
  await prisma.campaignBanner.updateMany({
    where: { id: { not: exceptId }, isActive: true },
    data: { isActive: false },
  });
}
