import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { applyCargoStatusWebhook } from "@/lib/services/cargo";
import { checkRateLimit, RateLimits } from "@/lib/rateLimit";
import {
  consumeReplayToken,
  createReplayFingerprint,
  isWebhookTimestampFresh,
} from "@/lib/security/replay-guard";

function getRequestIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip")?.trim() || "0.0.0.0";
}

function isIpAllowed(ip: string, allowlist: string): boolean {
  const entries = allowlist
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) return true;

  return entries.some((entry) => {
    if (entry === "*") return true;
    if (entry === ip) return true;

    if (entry.endsWith(".*")) {
      return ip.startsWith(entry.slice(0, -1));
    }

    return false;
  });
}

function securityAudit(event: string, data: Record<string, unknown>) {
  console.info(
    "[SECURITY_AUDIT]",
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...data,
    })
  );
}

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
    const requestIp = getRequestIp(req);
    const allowlist = process.env.CARGO_WEBHOOK_IP_ALLOWLIST || "";
    const rateLimitEnabled = (process.env.CARGO_WEBHOOK_RATE_LIMIT_ENABLED || "true") === "true";
    const maxSkewRaw = Number(process.env.CARGO_WEBHOOK_MAX_SKEW_SECONDS || "300");
    const replayTtlRaw = Number(process.env.CARGO_WEBHOOK_REPLAY_TTL_SECONDS || "300");
    const maxSkewSeconds = Number.isFinite(maxSkewRaw) && maxSkewRaw > 0 ? maxSkewRaw : 300;
    const replayTtlSeconds = Number.isFinite(replayTtlRaw) && replayTtlRaw > 0 ? replayTtlRaw : 300;

    if (allowlist && !isIpAllowed(requestIp, allowlist)) {
      securityAudit("cargo_webhook_ip_blocked", {
        ip: requestIp,
      });
      return NextResponse.json({ error: "WEBHOOK_IP_NOT_ALLOWED" }, { status: 403 });
    }

    if (rateLimitEnabled && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const limitResult = await checkRateLimit(`cargo-webhook:${requestIp}`, RateLimits.strict);
      if (!limitResult.success) {
        securityAudit("cargo_webhook_rate_limited", {
          ip: requestIp,
          limit: limitResult.limit,
          remaining: limitResult.remaining,
        });
        return NextResponse.json({ error: "RATE_LIMIT_EXCEEDED" }, { status: 429 });
      }
    }

    if (!isWebhookTimestampFresh(timestamp, maxSkewSeconds)) {
      securityAudit("cargo_webhook_stale_timestamp", {
        ip: requestIp,
      });
      return NextResponse.json({ error: "STALE_WEBHOOK_TIMESTAMP" }, { status: 401 });
    }

    const signature = verifyCargoWebhookSignature(req, rawBody);
    if (!signature) {
      securityAudit("cargo_webhook_invalid_signature", {
        ip: requestIp,
      });
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
      securityAudit("cargo_webhook_replay_detected", {
        ip: requestIp,
      });
      return NextResponse.json({ error: "REPLAY_DETECTED" }, { status: 409 });
    }

    const payload = JSON.parse(rawBody || "{}");
    const result = await applyCargoStatusWebhook({ payload });

    securityAudit("cargo_webhook_accepted", {
      ip: requestIp,
      orderId: result?.orderId,
      ignored: result?.ignored,
      status: result?.status,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    securityAudit("cargo_webhook_exception", {
      message: error?.message || "unknown",
    });
    console.error("[CARGO_STATUS_WEBHOOK]", error);
    return NextResponse.json(
      { error: "WEBHOOK_EXCEPTION" },
      { status: 500 }
    );
  }
}
