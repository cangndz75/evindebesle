import crypto from "crypto";
import { TAMI } from "./config";

// Tami'den verilen sabit girdiler (ENV):
const FIXED_KID_VALUE = process.env.TAMI_FIXED_KID_VALUE || "";
const FIXED_K_VALUE   = process.env.TAMI_FIXED_K_VALUE || "";

function sha512_b64(s: string) {
  return crypto.createHash("sha512").update(s, "utf8").digest("base64");
}
function b64url(buf: Buffer | string) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8");
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// kid = B64(SHA512(secretKey + fixed_kid_value))
//  k  = B64(SHA512(secretKey + fixed_k_value + merchant + terminal))
function buildKidAndKey() {
  if (!FIXED_KID_VALUE || !FIXED_K_VALUE) {
    throw new Error("Missing TAMI_FIXED_KID_VALUE or TAMI_FIXED_K_VALUE in .env");
  }
  const kidB64 = sha512_b64(TAMI.SECRET_KEY + FIXED_KID_VALUE);
  const kB64   = sha512_b64(TAMI.SECRET_KEY + FIXED_K_VALUE + TAMI.MERCHANT_ID + TAMI.TERMINAL_ID);
  const keyBytes = Buffer.from(kB64, "base64");

  // debug (güvenli kısa log)
  console.log("[TAMI JWK] kid(b64):", kidB64.slice(0, 12) + "...", "keyBytes:", keyBytes.length + "B");
  return { kid: kidB64, keyBytes };
}

/** v2 securityHash: HS512 JWS (payload = securityHash HARİÇ body) */
export function generateJwkSecurityHash(payload: any): string {
  const { securityHash, ...rest } = payload || {};
  const json = JSON.stringify(rest);

  const { kid, keyBytes } = buildKidAndKey();
  const header = { kid, typ: "JWT", alg: "HS512" };

  const h = b64url(JSON.stringify(header));
  const p = b64url(json);
  const signingInput = `${h}.${p}`;

  const sig = crypto.createHmac("sha512", keyBytes).update(signingInput, "utf8").digest();
  const s = b64url(sig);
  return `${signingInput}.${s}`;
}

/** /payment/complete-3ds → HMAC-SHA256 (base64) */
export function securityHashForComplete(orderId: string) {
  const data = [orderId, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID].join("|");
  return crypto.createHmac("sha256", Buffer.from(TAMI.SECRET_KEY, "utf8")).update(data, "utf8").digest("base64");
}

/** (opsiyonel) 3DS callback hash doğrulaması */
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

  const expected = crypto.createHmac("sha256", Buffer.from(TAMI.SECRET_KEY, "utf8")).update(data, "utf8").digest("base64");
  return { ok: expected === provided, expected, provided };
}
