import { prisma } from "@/lib/db";
import type { CampaignBanner, Prisma } from "@prisma/client";

export type CampaignDiscountTier = {
  threshold: number;
  discount: number;
  discountType?: "PERCENT" | "AMOUNT";
};

export type CampaignBannerStatus = "draft" | "scheduled" | "live" | "expired";

export type CampaignBannerPublic = {
  isActive: boolean;
  badgeText: string | null;
  title: string;
  description: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  subNote: string | null;
  discountTiers: CampaignDiscountTier[];
  themeColor: string;
};

export type CampaignBannerAdmin = CampaignBannerPublic & {
  id: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  status: CampaignBannerStatus;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_CAMPAIGN_BANNER: Omit<
  CampaignBannerPublic,
  "isActive"
> & { name: string } = {
  name: "Yeni Kampanya",
  badgeText: "BAYRAMA ÖZEL KAMPANYA",
  title: "BAYRAM\nİNDİRİMLERİ BAŞLADI",
  description:
    "Dark Velvet'in özel seçkilerinde fırsatlarla yaşam alanınızı yenileyin. Sepet tutarınıza göre artan indirim avantajını kaçırmayın.",
  buttonText: "Kampanyayı Keşfet",
  buttonUrl: "/indirim",
  subNote: "Sınırlı süre • Sepette otomatik uygulanır",
  discountTiers: [
    { threshold: 2500, discount: 15, discountType: "PERCENT" },
    { threshold: 3500, discount: 20, discountType: "PERCENT" },
    { threshold: 5000, discount: 30, discountType: "PERCENT" },
  ],
  themeColor: "olive",
};

export function parseDiscountTiers(
  raw: Prisma.JsonValue | null | undefined
): CampaignDiscountTier[] {
  if (!raw || !Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const threshold = Number(row.threshold);
      const discount = Number(row.discount);
      if (!Number.isFinite(threshold) || threshold <= 0) return null;
      if (!Number.isFinite(discount) || discount <= 0) return null;
      const discountType =
        row.discountType === "AMOUNT" || row.discountType === "PERCENT"
          ? row.discountType
          : "PERCENT";
      return { threshold, discount, discountType };
    })
    .filter((t): t is CampaignDiscountTier => t !== null)
    .sort((a, b) => a.threshold - b.threshold);
}

export function normalizeDiscountTiersFromBody(
  raw: unknown
): CampaignDiscountTier[] | null {
  if (!Array.isArray(raw)) return null;

  const tiers = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const threshold = Number(row.threshold);
      const discount = Number(row.discount);
      if (!Number.isFinite(threshold) || threshold <= 0) return null;
      if (!Number.isFinite(discount) || discount <= 0) return null;
      const discountType =
        row.discountType === "AMOUNT" || row.discountType === "PERCENT"
          ? row.discountType
          : "PERCENT";
      return {
        threshold: Math.round(threshold),
        discount: Math.round(discount),
        discountType,
      };
    })
    .filter((t): t is CampaignDiscountTier => t !== null);

  return tiers;
}

export function parseOptionalDate(
  value: unknown
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

export function isCampaignLive(
  row: Pick<CampaignBanner, "isActive" | "startsAt" | "endsAt">,
  now: Date = new Date()
): boolean {
  if (!row.isActive) return false;
  if (row.startsAt && row.startsAt > now) return false;
  if (row.endsAt && row.endsAt < now) return false;
  return true;
}

export function getCampaignStatus(
  row: Pick<CampaignBanner, "isActive" | "startsAt" | "endsAt">,
  now: Date = new Date()
): CampaignBannerStatus {
  if (!row.isActive) return "draft";
  if (row.endsAt && row.endsAt < now) return "expired";
  if (row.startsAt && row.startsAt > now) return "scheduled";
  return "live";
}

export function getCampaignStatusLabel(status: CampaignBannerStatus): string {
  switch (status) {
    case "live":
      return "Yayında";
    case "scheduled":
      return "Planlandı";
    case "expired":
      return "Süresi doldu";
    default:
      return "Taslak";
  }
}

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
  const now = new Date();
  const row = await prisma.campaignBanner.findFirst({
    where: activeCampaignWhere(now),
    orderBy: { updatedAt: "desc" },
  });
  if (!row || !isCampaignLive(row, now)) return null;
  return toPublicCampaignBanner(row);
}

export async function deactivateOtherCampaigns(
  exceptId: string
): Promise<void> {
  await prisma.campaignBanner.updateMany({
    where: { id: { not: exceptId }, isActive: true },
    data: { isActive: false },
  });
}

export type AppliedCampaignTier = {
  tier: CampaignDiscountTier;
  discountAmount: number;
  label: string;
};

export function getApplicableCampaignTier(
  subtotal: number,
  tiers: CampaignDiscountTier[]
): AppliedCampaignTier | null {
  if (subtotal <= 0 || tiers.length === 0) return null;

  const sorted = [...tiers].sort((a, b) => b.threshold - a.threshold);
  const tier = sorted.find((t) => subtotal >= t.threshold);
  if (!tier) return null;

  const discountAmount = computeTierDiscountAmount(subtotal, tier);
  if (discountAmount <= 0) return null;

  const label =
    tier.discountType === "AMOUNT"
      ? `${tier.threshold} TL üzeri ${tier.discount} TL indirim`
      : `${tier.threshold} TL üzeri %${tier.discount} indirim`;

  return { tier, discountAmount, label };
}

export function computeTierDiscountAmount(
  subtotal: number,
  tier: CampaignDiscountTier
): number {
  if (subtotal <= 0) return 0;

  const type = tier.discountType ?? "PERCENT";
  let amount =
    type === "AMOUNT" ? tier.discount : (subtotal * tier.discount) / 100;

  if (amount > subtotal) amount = subtotal;
  return Math.round(amount * 100) / 100;
}

export function computeCampaignDiscount(
  subtotal: number,
  tiers: CampaignDiscountTier[]
): number {
  const applied = getApplicableCampaignTier(subtotal, tiers);
  return applied?.discountAmount ?? 0;
}

export function getNextCampaignTier(
  subtotal: number,
  tiers: CampaignDiscountTier[]
): { tier: CampaignDiscountTier; remaining: number } | null {
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  const next = sorted.find((t) => subtotal < t.threshold);
  if (!next) return null;
  return { tier: next, remaining: next.threshold - subtotal };
}
