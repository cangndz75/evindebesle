// lib/tami.ts
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

export const TAMI = {
  baseURL: process.env.TAMI_BASE_URL!,
  merchantId: process.env.TAMI_MERCHANT_ID!,
  terminalId: process.env.TAMI_TERMINAL_ID!,
  secretKey: process.env.TAMI_SECRET_KEY!,
  fixedKid: process.env.TAMI_FIXED_KID!,
  fixedK: process.env.TAMI_FIXED_K!,
  callbackURL: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_BASE_URL}/api/tami/callback`,
};

export function pgAuthToken() {
  const text = `${TAMI.merchantId}${TAMI.terminalId}${TAMI.secretKey}`;
  const hash = crypto.createHash("sha256").update(text, "utf8").digest("base64");
  return `${TAMI.merchantId}:${TAMI.terminalId}:${hash}`;
}

export function correlationId() {
  return uuidv4();
}

function base64UrlEncode(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function computeHmacSha512(key: Buffer, data: Buffer) {
  return crypto.createHmac("sha512", key).update(data).digest();
}
function generateKidValue(secretKey: string, fixedKid: string) {
  const hash = crypto.createHash("sha512");
  hash.update(secretKey + fixedKid, "utf8");
  return hash.digest("base64");
}
function generateKValue(merchant: string, terminal: string, secretKey: string, fixedK: string) {
  const hash = crypto.createHash("sha512");
  hash.update(secretKey + fixedK + merchant + terminal, "utf8");
  return hash.digest("base64");
}

// TAMI v2 "securityHash" = JWS benzeri HS512 imzalı base64url(header).base64url(payload).base64url(sig)
export function generateJWKSignature(inputObject: unknown) {
  const kid = generateKidValue(TAMI.secretKey, TAMI.fixedKid);
  const k = generateKValue(TAMI.merchantId, TAMI.terminalId, TAMI.secretKey, TAMI.fixedK);

  const header = { kid, typ: "JWT", alg: "HS512" };
  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header), "utf8"));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(inputObject), "utf8"));
  const toSign = `${headerB64}.${payloadB64}`;
  const sig = computeHmacSha512(Buffer.from(k, "base64"), Buffer.from(toSign, "utf8"));
  const sigB64 = base64UrlEncode(sig);
  return `${headerB64}.${payloadB64}.${sigB64}`;
}

export function tamiHeaders() {
  return {
    "Content-Type": "application/json",
    "Accept-Language": "tr",
    "PG-Api-Version": "v2",
    "PG-Auth-Token": pgAuthToken(),
    correlationId: correlationId(),
  };
}
