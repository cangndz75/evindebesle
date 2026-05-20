import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toPublicWelcomePopupSettings } from "@/lib/welcome-popup";

export async function GET() {
  try {
    const settings = await prisma.welcomePopupSettings.findFirst();
    const publicSettings = toPublicWelcomePopupSettings(settings);

    if (!publicSettings.isEnabled) {
      return NextResponse.json({ isEnabled: false });
    }

    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error("Error fetching welcome popup settings:", error);
    return NextResponse.json({ isEnabled: false });
  }
}
