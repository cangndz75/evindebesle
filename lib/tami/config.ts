import crypto from "crypto";

export const TAMI = {
  BASE_URL: process.env.TAMI_BASE_URL ?? "https://sandbox-paymentapi.tami.com.tr",
  MERCHANT_ID: process.env.TAMI_MERCHANT_ID ?? "",
  TERMINAL_ID: process.env.TAMI_TERMINAL_ID ?? "",
  SECRET_KEY: process.env.TAMI_SECRET_KEY ?? "",
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:3000",
  AUTH_HASH_VERSION: process.env.TAMI_AUTH_HASH_VERSION ?? "v2",
  PG_TOKEN_HASH_ENCODING: (process.env.TAMI_PG_TOKEN_HASH_ENCODING ?? "hex").toLowerCase(),
};

// SHA256(merchantId + terminalId + secretKey) -> hex | base64 (biz hex)
function pgAuthToken(): string {
  const input = `${TAMI.MERCHANT_ID}${TAMI.TERMINAL_ID}${TAMI.SECRET_KEY}`;
  const enc: "hex" | "base64" = TAMI.PG_TOKEN_HASH_ENCODING === "base64" ? "base64" : "hex";
  const hash = crypto.createHash("sha256").update(input, "utf8").digest(enc);
  return `${TAMI.MERCHANT_ID}:${TAMI.TERMINAL_ID}:${hash}`;
}

export function makeCorrelationId() {
  const rnd = Math.floor(Math.random() * 1e9).toString().padStart(9, "0");
  return `Correlation${Date.now()}${rnd}`;
}

export function tamiHeaders(correlationId = makeCorrelationId()) {
  return {
    "Content-Type": "application/json",
    "Accept-Language": "tr",
    // ÖNEMLİ: v2 olmalı
    "PG-Api-Version": TAMI.AUTH_HASH_VERSION, // "v2"
    // ÖNEMLİ: tam isimler
    "PG-Auth-Token": pgAuthToken(),
    "CorrelationId": correlationId,
  };
}
