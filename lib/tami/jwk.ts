// lib/tami/jwk.ts
import crypto from "crypto";
import { TAMI } from "./config";

/** fixed değerler geldiyse onları, yoksa fallback üretim */
function computeKidAndK() {
  const fixedKid = process.env.TAMI_FIXED_KID?.trim();
  const fixedK   = process.env.TAMI_FIXED_K?.trim();

  if (fixedKid && fixedK) {
    const kid = crypto.createHash("sha512").update(TAMI.SECRET_KEY + fixedKid, "utf8").digest("base64");
    const k   = crypto
      .createHash("sha512")
      .update(TAMI.SECRET_KEY + fixedK + TAMI.MERCHANT_ID + TAMI.TERMINAL_ID, "utf8")
      .digest("base64");
    return { kid, k };
  }

  // fallback
  const kid = crypto.createHash("sha256").update(TAMI.SECRET_KEY, "utf8").digest("base64");
  const k   = crypto
    .createHash("sha512")
    .update(TAMI.SECRET_KEY + TAMI.MERCHANT_ID + TAMI.TERMINAL_ID, "utf8")
    .digest("base64");
  return { kid, k };
}

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * securityHash (JWS compact) — HS512
 * header: { alg:"HS512", typ:"JWT", kid }
 * payload: request body (içindeki "securityHash" alanı hariç!)
 * signature: HMAC-SHA512( base64url(header) + "." + base64url(payload), key=base64decode(k) )
 */
export function generateJWKSignature(input: unknown): string {
  const { kid, k } = computeKidAndK();

  let payloadObj: any;
  if (input && typeof input === "object") {
    payloadObj = JSON.parse(JSON.stringify(input));
    if ("securityHash" in payloadObj) delete payloadObj.securityHash;
  } else {
    payloadObj = input;
  }

  const header = { alg: "HS512", typ: "JWT", kid };
  const h = b64url(Buffer.from(JSON.stringify(header), "utf8"));
  const p = b64url(Buffer.from(JSON.stringify(payloadObj), "utf8"));
  const signingInput = `${h}.${p}`;

  const key = Buffer.from(k, "base64");
  const sig = crypto.createHmac("sha512", key).update(signingInput, "utf8").digest();
  const s = b64url(sig);

  const token = `${h}.${p}.${s}`;
  console.log("[TAMI JWS] kid:", kid.slice(0, 8) + "...", "k(b64):", k.slice(0, 8) + "...");
  return token;
}
