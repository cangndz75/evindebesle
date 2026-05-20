import { NextResponse } from "next/server";
import { getActiveCampaignBanner } from "@/lib/campaign-banner";

export async function GET() {
  try {
    const banner = await getActiveCampaignBanner();
    if (!banner) {
      return NextResponse.json({ isActive: false });
    }
    return NextResponse.json({ isActive: true, ...banner });
  } catch (error) {
    console.error("Error fetching campaign banner:", error);
    return NextResponse.json({ isActive: false });
  }
}
