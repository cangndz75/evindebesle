// lib/tami/jwk.ts
import crypto from "crypto";
import { TAMI } from "./config";

/**
 * JWKResource oluşturma
 * kid = Base64(SHA512(secretKey + FIXED_KID_VALUE))
 * k   = Base64(SHA512(secretKey + FIXED_K_VALUE + merchantId + terminalId))
 */
export function getJwkResource() {
  if (!TAMI.SECRET_KEY || !TAMI.MERCHANT_ID || !TAMI.TERMINAL_ID) {
    throw new Error("Missing TAMI env variables");
  }

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

  const jwk = {
    kty: "oct",
    use: "sig",
    kid,
    k,
    alg: "HS512",
  };

  console.log("[TAMI JWK]", jwk);
  return jwk;
}
