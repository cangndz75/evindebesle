import { NextRequest, NextResponse } from "next/server";
import { applyCargoStatusWebhook } from "@/lib/services/cargo";

function verifyCargoWebhookSignature(req: NextRequest, rawBody: string): boolean {
  const sharedSecret = process.env.CARGO_WEBHOOK_SECRET;
  if (!sharedSecret) return true;

  const signature =
    req.headers.get("x-cargo-signature") || req.headers.get("x-webhook-signature") || "";

  return signature === sharedSecret || signature === `${sharedSecret}:${rawBody.length}`;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!verifyCargoWebhookSignature(req, rawBody)) {
      return NextResponse.json({ error: "INVALID_WEBHOOK_SIGNATURE" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");
    const result = await applyCargoStatusWebhook({ payload });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[CARGO_STATUS_WEBHOOK]", error);
    return NextResponse.json(
      { error: error?.message || "WEBHOOK_EXCEPTION" },
      { status: 500 }
    );
  }
}
