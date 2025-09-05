import crypto from "crypto";
import { TAMI } from "./config";

/**
 * securityHash hesaplama
 * Formula: SHA256(orderId + amount + currency + merchantId + terminalId + secretKey)
 */
export function generateJwkSecurityHash(payload: any): string {
  const { orderId, amount, currency } = payload;
  const preimage = `${orderId}${amount}${currency}${TAMI.MERCHANT_ID}${TAMI.TERMINAL_ID}${TAMI.SECRET_KEY}`;
  const sig = crypto.createHash("sha256").update(preimage, "utf8").digest("base64");
  console.log("[TAMI HASH DEBUG]", { preimage, sig });
  return sig;
}

/** /payment/complete-3ds → HMAC-SHA256 (base64) */
export function securityHashForComplete(orderId: string) {
  const data = [orderId, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID].join("|");
  return crypto
    .createHmac("sha256", Buffer.from(TAMI.SECRET_KEY, "utf8"))
    .update(data, "utf8")
    .digest("base64");
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

  const expected = crypto
    .createHmac("sha256", Buffer.from(TAMI.SECRET_KEY, "utf8"))
    .update(data, "utf8")
    .digest("base64");

  return { ok: expected === provided, expected, provided };
}
