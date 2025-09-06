// lib/tami/jwk.ts
import crypto from "crypto";
import { TAMI } from "./config";

export function getJwkResource() {
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

  const jwk = { kty: "oct", use: "sig", kid, k, alg: "HS512" };
  console.log("[DEBUG TAMI JWK]", jwk);
  return jwk;
}
