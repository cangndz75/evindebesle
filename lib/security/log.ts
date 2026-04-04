import "server-only";

const SENSITIVE_KEYS = [
  "password",
  "passwordhash",
  "token",
  "authorization",
  "cookie",
  "secret",
  "apiKey",
  "card",
  "cvv",
  "iban",
  "email",
  "phone",
];

function shouldRedact(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((k) => lower.includes(k.toLowerCase()));
}

export function redactForLog(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input !== "object") return input;

  if (Array.isArray(input)) {
    return input.map(redactForLog);
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (shouldRedact(k)) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactForLog(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}
