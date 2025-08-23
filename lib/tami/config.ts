import crypto from "crypto";

export const TAMI = {
  BASE_URL: process.env.TAMI_BASE_URL ?? "",
  APP_BASE_URL:
    process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_BASE_URL || "",
  MERCHANT_ID: process.env.TAMI_MERCHANT_ID ?? "",
  TERMINAL_ID: process.env.TAMI_TERMINAL_ID ?? "",
  SECRET_KEY: process.env.TAMI_SECRET_KEY ?? "",
  // JWK için sabitler (Tami’den verilen TEST/PROD değerleri)
  FIXED_KID_VALUE: process.env.TAMI_FIXED_KID ?? "",
  FIXED_K_VALUE: process.env.TAMI_FIXED_K ?? "",
};

function ensureEnv() {
  const miss: string[] = [];
  if (!TAMI.BASE_URL) miss.push("TAMI_BASE_URL");
  if (!TAMI.MERCHANT_ID) miss.push("TAMI_MERCHANT_ID");
  if (!TAMI.TERMINAL_ID) miss.push("TAMI_TERMINAL_ID");
  if (!TAMI.SECRET_KEY) miss.push("TAMI_SECRET_KEY");
  if (!TAMI.FIXED_KID_VALUE) miss.push("TAMI_FIXED_KID");
  if (!TAMI.FIXED_K_VALUE) miss.push("TAMI_FIXED_K");
  if (miss.length) throw new Error(`Missing env for TAMI: ${miss.join(", ")}`);
}

/**
 * PG-Auth-Token = merchantId:terminalId:Base64( SHA256( merchantId + terminalId + secretKey ) )
 * Dokümandaki örnekler base64 kullanır. (hex gönderirsen 9011/4003 alırsın)
 */
export function buildPgAuthToken(): string {
  ensureEnv();
  const preimage = `${TAMI.MERCHANT_ID}${TAMI.TERMINAL_ID}${TAMI.SECRET_KEY}`;
  const digestB64 = crypto.createHash("sha256").update(preimage, "utf8").digest("base64");
  const token = `${TAMI.MERCHANT_ID}:${TAMI.TERMINAL_ID}:${digestB64}`;
  console.log("[TAMI] PG-Auth preimage = MID:TID:SECRET ; hash (B64) = %s...", digestB64.slice(0, 8));
  return token;
}

/** Tüm istekler için ortak header seti */
export function tamiHeaders(correlationId?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": "tr",
    // Dokümana göre zorunlu:
    "PG-Api-Version": "v2",
    "PG-Auth-Token": buildPgAuthToken(),
  };

  if (correlationId) {
    // Farklı reverse proxy’lerde isim duyarlılıkları olabildiği için 1’den fazla varyant ekliyoruz
    headers["correlationId"] = correlationId;
    headers["CorrelationId"] = correlationId;
  }

  return headers;
}
