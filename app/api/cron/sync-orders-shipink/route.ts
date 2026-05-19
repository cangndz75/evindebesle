import { NextRequest, NextResponse } from "next/server";
import { runShipinkOrderSync } from "@/lib/jobs/syncOrdersToShipink";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = (process.env.CRON_SECRET || "").trim();

function verifyCronAuth(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "production" && !CRON_SECRET) {
    console.error("[SHIPINK_CRON] Production'da CRON_SECRET zorunlu.");
    return false;
  }
  if (!CRON_SECRET) return true;

  const auth =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    new URL(req.url).searchParams.get("secret")?.trim() ||
    "";
  return auth === CRON_SECRET;
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const result = await runShipinkOrderSync();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "SYNC_EXCEPTION";
    console.error("[SYNC_ORDERS_SHIPINK] Genel hata:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
