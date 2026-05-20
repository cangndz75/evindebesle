import { NextResponse } from "next/server";
import { getActiveCampaignBanner } from "@/lib/campaign-banner.server";

export async function GET() {
  try {
    const banner = await getActiveCampaignBanner();
    if (!banner) {
      return NextResponse.json({ isActive: false });
    }
    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error fetching campaign banner:", error);
    return NextResponse.json({ isActive: false });
  }
}
