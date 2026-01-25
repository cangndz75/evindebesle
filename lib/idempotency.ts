import crypto from "crypto";

export function normalizeIdempotencyKey(key?: string | null) {
    if (!key || key.length < 10) return crypto.randomUUID();
    return key.slice(0, 200);
}
