// lib/tami/hash.ts
import { createHash, createSecretKey } from "crypto";
import { CompactSign } from "jose";
import { TAMI } from "./config";

const FIXED_KID = (process.env.TAMI_FIXED_KID_VALUE || "").trim();
const FIXED_K   = (process.env.TAMI_FIXED_K_VALUE || "").trim();

/**
 * kid = Base64(SHA512(secretKey + fixed_kid_value))
 */
function makeKid(secret: string): string {
  return createHash("sha512").update(secret + FIXED_KID, "utf8").digest("base64");
}

/**
 * k = Base64(SHA512(secretKey + fixed_k_value + merchantId + terminalId))
 * !!! SIRA ÖNEMLİ !!!
 */
function makeK(secret: string, mid: string, tid: string): string {
  return createHash("sha512").update(secret + FIXED_K + mid + tid, "utf8").digest("base64");
}

/**
 * JWS / HS512 securityHash üretimi (AUTH için)
 * Not: input içinde yanlışlıkla "securityHash" varsa imza öncesi çıkartıyoruz.
 */
export async function generateSecurityHashV2(input: unknown): Promise<string> {
  const kid = makeKid(TAMI.SECRET_KEY);
  const k   = makeK(TAMI.SECRET_KEY, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID);

  // payload'tan securityHash alanını ayıkla (imzaya dahil edilmemeli)
  const payloadObj =
    input && typeof input === "object"
      ? JSON.parse(
          JSON.stringify(input, (key, value) =>
            key === "securityHash" ? undefined : value
          )
        )
      : input;

  const protectedHeader = { alg: "HS512" as const, typ: "JWT" as const, kid };
  const key = createSecretKey(Buffer.from(k, "base64"));
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8");

  const jws = await new CompactSign(payload)
    .setProtectedHeader(protectedHeader)
    .sign(key);

  return jws; // Compact JWS
}

/**
 * 3DS complete → HMAC-SHA256 (orderId|merchantId|terminalId + secretKey)
 */
export function securityHashForComplete(orderId: string) {
  const data = [orderId, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID].join("|");
  return createHash("sha256").update(data + TAMI.SECRET_KEY, "utf8").digest("base64");
}

/**
 * 3DS callback (hashedData doğrulaması)
 * cardOrg/Brand/Type + maskedNumber + installmentCount + currency + originalAmount
 * + orderId + systemTime + success  → HMAC-SHA256(... + secretKey) Base64
 */
export function verify3DHashedData(form: FormData) {
  const g = (k: string) => String(form.get(k) ?? "");

  const data =
    (g("cardOrganization") || g("cardOrg")) +
    g("cardBrand") +
    g("cardType") +
    g("maskedNumber") +
    (g("installmentCount") || "1") +
    (g("currencyCode") || g("currency") || "TRY") +
    (g("originalAmount") || g("txnAmount")) +
    g("orderId") +
    g("systemTime") +
    (g("success") || g("status"));

  const provided = g("hashedData");
  if (!provided) return { ok: true as const, reason: "no-hash" as const };

  const expected = createHash("sha256").update(data + TAMI.SECRET_KEY, "utf8").digest("base64");
  return { ok: expected === provided, expected, provided };
}
