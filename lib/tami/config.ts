import crypto from "crypto";

export const TAMI = {
  BASE_URL: process.env.TAMI_BASE_URL ?? "",
  APP_BASE_URL:
    process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_BASE_URL || "",
  MERCHANT_ID: process.env.TAMI_MERCHANT_ID ?? "",
  TERMINAL_ID: process.env.TAMI_TERMINAL_ID ?? "",
  SECRET_KEY: process.env.TAMI_SECRET_KEY ?? "",
  API_VERSION: process.env.TAMI_API_VERSION || "v2",
};

function ensureEnv() {
  const miss: string[] = [];
  if (!TAMI.BASE_URL) miss.push("TAMI_BASE_URL");
  if (!TAMI.MERCHANT_ID) miss.push("TAMI_MERCHANT_ID");
  if (!TAMI.TERMINAL_ID) miss.push("TAMI_TERMINAL_ID");
  if (!TAMI.SECRET_KEY) miss.push("TAMI_SECRET_KEY");
  if (miss.length) throw new Error(`Missing env for TAMI: ${miss.join(", ")}`);
}

/**
 * PG-Auth-Token = merchantId:terminalId:SHA256(merchantId + terminalId + secretKey)
 * encoding: base64 (varsayılan) | hex
 */
export function buildPgAuthToken(): string {
  ensureEnv();
  type Enc = "hex" | "base64";
  const encEnv = String(
    process.env.TAMI_PG_TOKEN_HASH_ENCODING || "base64"
  ).toLowerCase();
  const encoding: Enc = encEnv === "hex" ? "hex" : "base64";

  const preimage = `${TAMI.MERCHANT_ID}${TAMI.TERMINAL_ID}${TAMI.SECRET_KEY}`;
  const digest = crypto
    .createHash("sha256")
    .update(preimage, "utf8")
    .digest(encoding);

  // Güvenli kısa log
  console.log("[TAMI] PG-Auth preimage = MID:TID:SECRET ; hash (%s) = %s...", encoding, digest.slice(0, 8));
  return `${TAMI.MERCHANT_ID}:${TAMI.TERMINAL_ID}:${digest}`;
}

export function newCorrelationId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Ortak header set’i */
export function tamiHeaders(correlationId?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": "tr",
    "PG-Api-Version": TAMI.API_VERSION,
    "PG-Auth-Token": buildPgAuthToken(),
  };
  if (correlationId) headers["CorrelationId"] = correlationId;
  return headers;
}
