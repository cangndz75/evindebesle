// lib/tami/hash.ts
import { TAMI } from "@/lib/tami";
import { createHash, createSecretKey } from "crypto";
import { CompactSign } from "jose";

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
 * JWS / HS512 securityHash üretimi
 * Body içeriğini imzalar → compact JWS string döner
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
