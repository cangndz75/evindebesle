import { NextRequest, NextResponse } from "next/server";
import {
  computeCampaignDiscount,
  getApplicableCampaignTier,
  getNextCampaignTier,
} from "@/lib/campaign-banner";
import { getActiveCampaignBanner } from "@/lib/campaign-banner.server";

export async function GET(request: NextRequest) {
  try {
    const subtotalParam = request.nextUrl.searchParams.get("subtotal");
    const subtotal = Number(subtotalParam);

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: "Geçersiz sepet tutarı" }, { status: 400 });
    }

    const banner = await getActiveCampaignBanner();
    if (!banner) {
      return NextResponse.json({
        isActive: false,
        discount: 0,
        subtotalAfterDiscount: subtotal,
      });
    }

    const applied = getApplicableCampaignTier(subtotal, banner.discountTiers);
    const discount = computeCampaignDiscount(subtotal, banner.discountTiers);
    const nextTier = getNextCampaignTier(subtotal, banner.discountTiers);

    return NextResponse.json({
      isActive: true,
      discount,
      subtotalAfterDiscount: Math.max(0, subtotal - discount),
      appliedTier: applied
        ? {
            threshold: applied.tier.threshold,
            discount: applied.tier.discount,
            discountType: applied.tier.discountType ?? "PERCENT",
            label: applied.label,
          }
        : null,
      nextTier: nextTier
        ? {
            threshold: nextTier.tier.threshold,
            discount: nextTier.tier.discount,
            discountType: nextTier.tier.discountType ?? "PERCENT",
            remaining: Math.ceil(nextTier.remaining),
          }
        : null,
    });
  } catch (error) {
    console.error("Campaign banner estimate error:", error);
    return NextResponse.json({ error: "Hesaplama başarısız" }, { status: 500 });
  }
}
