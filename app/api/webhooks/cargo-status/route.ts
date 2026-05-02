import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { applyCargoStatusWebhook } from "@/lib/services/cargo";
import {
  consumeReplayToken,
  createReplayFingerprint,
  isWebhookTimestampFresh,
} from "@/lib/security/replay-guard";

function verifyCargoWebhookSignature(req: NextRequest, rawBody: string): string | null {
  const sharedSecret = process.env.CARGO_WEBHOOK_SECRET;
  if (!sharedSecret) return null;

  const signatureHeader =
    req.headers.get("x-cargo-signature") || req.headers.get("x-webhook-signature") || "";
  const signature = (signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length)
    : signatureHeader)
    .trim()
    .toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(signature)) return null;

  const timestamp = req.headers.get("x-cargo-timestamp") || "";
  if (!timestamp) return null;

  const expectedWithTimestamp = createHmac("sha256", sharedSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expectedWithTimestamp, "utf8");

  if (expectedBuf.length !== sigBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, sigBuf)) return null;

  return signature;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-cargo-timestamp");
    const maxSkewRaw = Number(process.env.CARGO_WEBHOOK_MAX_SKEW_SECONDS || "300");
    const replayTtlRaw = Number(process.env.CARGO_WEBHOOK_REPLAY_TTL_SECONDS || "300");
    const maxSkewSeconds = Number.isFinite(maxSkewRaw) && maxSkewRaw > 0 ? maxSkewRaw : 300;
    const replayTtlSeconds = Number.isFinite(replayTtlRaw) && replayTtlRaw > 0 ? replayTtlRaw : 300;

    if (!isWebhookTimestampFresh(timestamp, maxSkewSeconds)) {
      return NextResponse.json({ error: "STALE_WEBHOOK_TIMESTAMP" }, { status: 401 });
    }

    const signature = verifyCargoWebhookSignature(req, rawBody);
    if (!signature) {
      return NextResponse.json({ error: "INVALID_WEBHOOK_SIGNATURE" }, { status: 401 });
    }

    const replayFingerprint = createReplayFingerprint({
      signature,
      timestamp: timestamp!,
      body: rawBody,
      eventId: req.headers.get("x-cargo-event-id") || req.headers.get("x-webhook-id"),
    });

    const replayTokenAccepted = await consumeReplayToken(replayFingerprint, replayTtlSeconds);
    if (!replayTokenAccepted) {
      return NextResponse.json({ error: "REPLAY_DETECTED" }, { status: 409 });
    }

    const payload = JSON.parse(rawBody || "{}");
    const result = await applyCargoStatusWebhook({ payload });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[CARGO_STATUS_WEBHOOK]", error);
    return NextResponse.json(
      { error: "WEBHOOK_EXCEPTION" },
      { status: 500 }
    );
  }
}
