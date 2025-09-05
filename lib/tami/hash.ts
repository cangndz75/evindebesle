// lib/tami/hash.ts
import { createHash, createSecretKey } from "crypto";
import { CompactSign } from "jose";
import { TAMI } from "./config";

// .env'den gelen fixed değerler
const FIXED_KID = process.env.TAMI_FIXED_KID_VALUE!;
const FIXED_K   = process.env.TAMI_FIXED_K_VALUE!;

// Base64(SHA512(secretKey + FIXED_KID))
function makeKid(secret: string): string {
  const raw = createHash("sha512")
    .update(secret + FIXED_KID, "utf8")
    .digest();
  return raw.toString("base64");
}

// Base64(SHA512(secretKey + FIXED_K + merchant + terminal))
function makeK(secret: string, mid: string, tid: string): string {
  const raw = createHash("sha512")
    .update(secret + FIXED_K + mid + tid, "utf8")
    .digest();
  return raw.toString("base64");
}

/**
 * JWS / HS512 securityHash üretimi (AUTH aşaması)
 */
export async function generateSecurityHashV2(bodyWithoutHash: any): Promise<string> {
  console.log("[TAMI][SECURITY_HASH_INPUT]", bodyWithoutHash);

  const kid = makeKid(TAMI.SECRET_KEY);
  const k   = makeK(TAMI.SECRET_KEY, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID);

  console.log("[TAMI][KID_K]", { kid, k });

  const protectedHeader = { alg: "HS512", typ: "JWT", kid };
  const key = createSecretKey(Buffer.from(k, "base64"));
  const payload = Buffer.from(JSON.stringify(bodyWithoutHash), "utf8");

  console.log("[TAMI][JWS_HEADER]", protectedHeader);

  const jws = await new CompactSign(payload)
    .setProtectedHeader(protectedHeader)
    .sign(key);

  console.log("[TAMI][SECURITY_HASH_OUT]", jws);
  return jws;
}

/**
 * 3DS complete → HMAC-SHA256 (orderId|merchantId|terminalId)
 */
export function securityHashForComplete(orderId: string) {
  const data = [orderId, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID].join("|");
  return createHash("sha256")
    .update(data + TAMI.SECRET_KEY, "utf8")
    .digest("base64");
}

/**
 * 3DS callback doğrulama
 */
export function verify3DHashedData(form: FormData) {
  const g = (k: string) => String(form.get(k) ?? "");
  const data = [
    g("cardOrganization") || g("cardOrg"),
    g("cardBrand"),
    g("cardType"),
    g("maskedNumber"),
    g("installmentCount") || "1",
    g("currencyCode") || g("currency") || "TRY",
    g("originalAmount") || g("txnAmount"),
    g("orderId"),
    g("systemTime"),
    g("success") || g("status"),
  ].join("");

  const provided = g("hashedData");
  if (!provided) return { ok: true, reason: "no-hash" as const };

  const expected = createHash("sha256")
    .update(data + TAMI.SECRET_KEY, "utf8")
    .digest("base64");

  return { ok: expected === provided, expected, provided };
}
