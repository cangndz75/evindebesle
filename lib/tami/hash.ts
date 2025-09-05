// lib/tami/hash.ts
import { createHash, createSecretKey, createHmac } from "crypto";
import { CompactSign } from "jose";
import { TAMI } from "./config";

const FIXED_KID = process.env.TAMI_FIXED_KID_VALUE!;
const FIXED_K   = process.env.TAMI_FIXED_K_VALUE!;

// JWS için
function makeKid(secret: string): string {
  return createHash("sha512").update(secret + FIXED_KID, "utf8").digest("base64");
}
function makeK(secret: string, mid: string, tid: string): string {
  return createHash("sha512").update(secret + FIXED_K + mid + tid, "utf8").digest("base64");
}

// v1 (SHA256 klasik)
function generateSecurityHashV1(payload: any): string {
  const { orderId, amount, currency } = payload;
  const preimage = `${orderId}${amount}${currency}${TAMI.MERCHANT_ID}${TAMI.TERMINAL_ID}${TAMI.SECRET_KEY}`;
  return createHash("sha256").update(preimage, "utf8").digest("base64");
}

// v2 (HS512 JWS)
async function generateSecurityHashV2(bodyWithoutHash: any): Promise<string> {
  const kid = makeKid(TAMI.SECRET_KEY);
  const k   = makeK(TAMI.SECRET_KEY, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID);
  const protectedHeader = { alg: "HS512", typ: "JWT", kid };
  const key = createSecretKey(Buffer.from(k, "base64"));
  const payload = Buffer.from(JSON.stringify(bodyWithoutHash), "utf8");
  return await new CompactSign(payload).setProtectedHeader(protectedHeader).sign(key);
}

// ✅ dışarıya tek bir fonksiyon export et
export async function generateSecurityHash(bodyWithoutHash: any): Promise<string> {
  if ((process.env.TAMI_AUTH_HASH_VERSION || "v1") === "v2") {
    return generateSecurityHashV2(bodyWithoutHash);
  }
  return generateSecurityHashV1(bodyWithoutHash);
}

// ✅ complete 3ds için
export function securityHashForComplete(orderId: string) {
  const data = [orderId, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID].join("|");
  return createHmac("sha256", Buffer.from(TAMI.SECRET_KEY, "utf8"))
    .update(data, "utf8")
    .digest("base64");
}

// ✅ callback doğrulama için
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
