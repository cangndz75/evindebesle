// lib/tami/config.ts
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
 * PG-Auth-Token = merchantId:terminalId:Base64(SHA256(merchantId + terminalId + secretKey))
 */
export function buildPgAuthToken(): string {
  ensureEnv();
  const preimage = `${TAMI.MERCHANT_ID}${TAMI.TERMINAL_ID}${TAMI.SECRET_KEY}`;
  const digest = crypto.createHash("sha256").update(preimage, "utf8").digest("base64");
  return `${TAMI.MERCHANT_ID}:${TAMI.TERMINAL_ID}:${digest}`;
}

export function newCorrelationId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `Correlation${rand}`;
}

export function tamiHeaders(correlationId?: string): [string, string][] {
  const headers: [string, string][] = [
    ["Content-Type", "application/json"],
    ["Accept-Language", "tr"],
    ["PG-Api-Version", TAMI.API_VERSION],
    ["PG-Auth-Token", buildPgAuthToken()],
  ];
  if (correlationId) headers.push(["CorrelationId", correlationId]);
  return headers;
}
