import crypto from "crypto";
import { TAMI } from "./config";

/** base64url yardımcıları */
const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");

/** kid = Base64( SHA512( secretKey + FIXED_KID_VALUE ) ) */
function makeKid(): string {
  const h = crypto.createHash("sha512");
  h.update(TAMI.SECRET_KEY + TAMI.FIXED_KID_VALUE, "utf8");
  return h.digest("base64");
}

/** k   = Base64( SHA512( secretKey + FIXED_K_VALUE + merchant + terminal ) ) */
function makeK(): string {
  const h = crypto.createHash("sha512");
  h.update(TAMI.SECRET_KEY + TAMI.FIXED_K_VALUE + TAMI.MERCHANT_ID + TAMI.TERMINAL_ID, "utf8");
  return h.digest("base64");
}

/**
 * JWK/HS512 ile body’yi imzalar → securityHash (JWT benzeri 3 parçalı token)
 * DİKKAT: İmzalanan input **securityHash alanını içermemelidir** (doküman notu).
 */
export function signRequestWithJWK(bodyWithoutSecurityHash: unknown): string {
  const kid = makeKid();
  const kB64 = makeK();
  const key = Buffer.from(kB64, "base64");

  const header = { kty: "oct", use: "sig", alg: "HS512", kid };
  const headerB64 = b64url(Buffer.from(JSON.stringify(header), "utf8"));
  const payloadB64 = b64url(Buffer.from(JSON.stringify(bodyWithoutSecurityHash), "utf8"));

  const signer = crypto.createHmac("sha512", key);
  signer.update(`${headerB64}.${payloadB64}`, "utf8");
  const sigB64 = b64url(signer.digest());

  const token = `${headerB64}.${payloadB64}.${sigB64}`;
  console.log("[TAMI JWK] kid=%s… k=%s… token=%s…",
    kid.slice(0, 6), kB64.slice(0, 6), token.slice(0, 10));
  return token;
}

/** (Opsiyonel) 3DS dönen hashedData doğrulaması — JWK ile ilgili değildir. */
export function verify3DHashedData(form: FormData) {
  const s = [
    String(form.get("cardOrganization") ?? form.get("cardOrg") ?? ""),
    String(form.get("cardBrand") ?? ""),
    String(form.get("cardType") ?? ""),
    String(form.get("maskedNumber") ?? ""),
    String(form.get("installmentCount") ?? "1"),
    String(form.get("currencyCode") ?? form.get("currency") ?? "TRY"),
    String(form.get("originalAmount") ?? form.get("txnAmount") ?? ""),
    String(form.get("orderId") ?? ""),
    String(form.get("systemTime") ?? ""),
    String(form.get("success") ?? form.get("status") ?? ""),
  ].join("");

  const provided = String(form.get("hashedData") ?? "");
  if (!provided) return { ok: true, reason: "no-hash" as const };

  const expected = crypto
    .createHmac("sha256", Buffer.from(TAMI.SECRET_KEY, "utf8"))
    .update(Buffer.from(s, "utf8"))
    .digest("base64");

  return { ok: expected === provided, expected, provided };
}
