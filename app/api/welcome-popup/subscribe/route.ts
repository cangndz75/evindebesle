import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { rateLimit } from "@/lib/rateLimit";
import {
  WelcomePopupClaimError,
  claimWelcomePopupDiscount,
} from "@/lib/services/welcome-popup-claim";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const { success } = await rateLimit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const session = await getServerSession(authConfig);
    const { email } = await req.json();
    const result = await claimWelcomePopupDiscount(
      typeof email === "string" ? email : "",
      { userId: session?.user?.id }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof WelcomePopupClaimError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[WELCOME_POPUP_SUBSCRIBE]", error);
    return NextResponse.json(
      { error: "Sunucu içi bir hata oluştu." },
      { status: 500 }
    );
  }
}
