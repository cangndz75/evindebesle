// lib/tami/hash.ts
import crypto from "crypto";
import { CompactSign } from "jose";
import { TAMI } from "./config";

/**
 * kid ve k değerlerini hesapla (dokümana %100 uygun)
 */
function getJwkResource() {
  const FIXED_KID = (process.env.TAMI_FIXED_KID_VALUE || "").trim();
  const FIXED_K   = (process.env.TAMI_FIXED_K_VALUE || "").trim();

  const kid = crypto
    .createHash("sha512")
    .update(TAMI.SECRET_KEY + FIXED_KID, "utf8")
    .digest("base64");

  const k = crypto
    .createHash("sha512")
    .update(TAMI.SECRET_KEY + FIXED_K + TAMI.MERCHANT_ID + TAMI.TERMINAL_ID, "utf8")
    .digest("base64");

  return { kid, k };
}

/**
 * JWS / HS512 securityHash üretimi (AUTH için)
 */
export async function generateSecurityHashV2(input: any): Promise<string> {
  const { kid, k } = getJwkResource();

  const payloadObj =
    input && typeof input === "object"
      ? JSON.parse(JSON.stringify(input, (key, value) => (key === "securityHash" ? undefined : value)))
      : input;

  const protectedHeader = { alg: "HS512" as const, typ: "JWT" as const, kid };
  const key = crypto.createSecretKey(Buffer.from(k, "base64"));
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8");

  const jws = await new CompactSign(payload)
    .setProtectedHeader(protectedHeader)
    .sign(key);

  return jws;
}

/**
 * 3DS complete → HMAC-SHA256 (orderId|merchantId|terminalId + secretKey)
 */
export function securityHashForComplete(orderId: string) {
  const data = [orderId, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID].join("|");
  return crypto.createHash("sha256").update(data + TAMI.SECRET_KEY, "utf8").digest("base64");
}
