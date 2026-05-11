import "server-only";

const CARD_DATA_KEYS = [
  "pan",
  "cardnumber",
  "card_number",
  "cvv",
  "cvc",
  "expirydate",
  "expiry",
  "expirymonth",
  "expiremonth",
  "expireyear",
  "cardholdername",
  "holdername",
  "track2",
] as const;

function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function walk(
  value: unknown,
  path: string[],
  findings: Array<{ key: string; path: string }>
) {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      walk(value[i], [...path, String(i)], findings);
    }
    return;
  }

  if (typeof value !== "object") return;

  for (const [rawKey, nested] of Object.entries(value as Record<string, unknown>)) {
    const key = normalizeKey(rawKey);
    const fullPath = [...path, rawKey].join(".");

    if (CARD_DATA_KEYS.includes(key as (typeof CARD_DATA_KEYS)[number])) {
      findings.push({ key: rawKey, path: fullPath });
    }

    if (key === "card" && typeof nested === "object" && nested !== null) {
      findings.push({ key: rawKey, path: fullPath });
    }

    walk(nested, [...path, rawKey], findings);
  }
}

export function detectCardDataInPayload(payload: unknown) {
  const findings: Array<{ key: string; path: string }> = [];
  walk(payload, [], findings);
  return findings;
}

export function hasCardDataInPayload(payload: unknown): boolean {
  return detectCardDataInPayload(payload).length > 0;
}
