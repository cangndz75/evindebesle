export function normalizeIdempotencyKey(key?: string | null) {
    if (!key) return null;
    const normalized = key.trim();
    if (normalized.length < 10) return null;
    return normalized.slice(0, 200);
}
