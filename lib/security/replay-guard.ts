import { createHash } from "crypto";

import { Redis } from "@upstash/redis";

const REPLAY_PREFIX = "cargo:webhook:replay";
const inMemoryReplayMap = new Map<string, number>();

let redisClient: Redis | null = null;
let redisInitAttempted = false;

function getRedisClient(): Redis | null {
  if (redisInitAttempted) {
    return redisClient;
  }

  redisInitAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function parseTimestamp(timestampHeader: string): number | null {
  const numeric = Number(timestampHeader);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    // If value looks like epoch seconds, convert to milliseconds.
    return numeric > 1e12 ? numeric : numeric * 1000;
  }

  const parsed = Date.parse(timestampHeader);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

function cleanupExpiredInMemoryTokens(nowMs: number): void {
  for (const [key, expiresAt] of inMemoryReplayMap.entries()) {
    if (expiresAt <= nowMs) {
      inMemoryReplayMap.delete(key);
    }
  }
}

export function isWebhookTimestampFresh(
  timestampHeader: string | null | undefined,
  toleranceSeconds = 300,
  nowMs = Date.now()
): boolean {
  if (!timestampHeader) {
    return false;
  }

  const parsedTimestampMs = parseTimestamp(timestampHeader);
  if (parsedTimestampMs === null) {
    return false;
  }

  return Math.abs(nowMs - parsedTimestampMs) <= toleranceSeconds * 1000;
}

export function createReplayFingerprint(input: {
  signature: string;
  timestamp: string;
  body: string;
  eventId?: string | null;
}): string {
  const normalizedEventId = input.eventId?.trim();
  const payload = normalizedEventId
    ? `${input.signature}:${input.timestamp}:${normalizedEventId}`
    : `${input.signature}:${input.timestamp}:${input.body}`;

  return createHash("sha256").update(payload).digest("hex");
}

export async function consumeReplayToken(
  replayFingerprint: string,
  ttlSeconds = 300
): Promise<boolean> {
  const key = `${REPLAY_PREFIX}:${replayFingerprint}`;
  const nowMs = Date.now();
  const redis = getRedisClient();

  if (redis) {
    try {
      const result = await redis.set(key, "1", { nx: true, ex: ttlSeconds });
      return result === "OK";
    } catch {
      // Fall through to in-memory guard to avoid dropping protection entirely.
    }
  }

  cleanupExpiredInMemoryTokens(nowMs);

  const existingExpiry = inMemoryReplayMap.get(key);
  if (typeof existingExpiry === "number" && existingExpiry > nowMs) {
    return false;
  }

  inMemoryReplayMap.set(key, nowMs + ttlSeconds * 1000);
  return true;
}
