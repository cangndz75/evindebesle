// lib/tami/hash.ts
import { createHash, createSecretKey } from "crypto";
import { CompactSign } from "jose";
import { TAMI } from "./config";

// .env’den gelen fixed değerler
const FIXED_KID = process.env.TAMI_FIXED_KID_VALUE?.trim()!;
const FIXED_K   = process.env.TAMI_FIXED_K_VALUE?.trim()!;

/**
 * kid = Base64(SHA512(secretKey + fixedKid))
 */
function makeKid(secret: string): string {
  const raw = createHash("sha512")
    .update(secret + FIXED_KID, "utf8")
    .digest();
  return raw.toString("base64");
}

/**
 * k = Base64(SHA512(merchantId + terminalId + secretKey + fixedK))
 */
function makeK(secret: string, mid: string, tid: string): string {
  const raw = createHash("sha512")
    .update(mid + tid + secret + FIXED_K, "utf8")
    .digest();
  return raw.toString("base64");
}

/**
 * JWS / HS512 securityHash üretimi (AUTH için)
 */
export async function generateSecurityHashV2(bodyWithoutHash: any): Promise<string> {
  console.log("[TAMI][SECURITY_HASH_INPUT]", bodyWithoutHash);

  const kid = makeKid(TAMI.SECRET_KEY);
  const k   = makeK(TAMI.SECRET_KEY, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID);

  console.log("[TAMI][KID]", kid);
  console.log("[TAMI][K]", k);

  const protectedHeader = { alg: "HS512", typ: "JWT", kid };
  const key = createSecretKey(Buffer.from(k, "base64"));
  const payload = Buffer.from(JSON.stringify(bodyWithoutHash), "utf8");

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
