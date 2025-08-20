import crypto from "crypto";
import { TAMI } from "./config";

/** HMAC-SHA256 (Base64) */
function hmacB64(data: string) {
  return crypto.createHmac("sha256", Buffer.from(TAMI.SECRET_KEY, "utf8"))
    .update(Buffer.from(data, "utf8"))
    .digest("base64");
}

/**
 * AUTH securityHash
 * - v1:  orderId|amount|currency|installmentCount|merchantId|terminalId
 * - v2:  merchantId|terminalId|orderId|amount|currency|installmentCount|paymentGroup|paymentChannel|callbackUrl
 *   (Tami dokümanlarında yaygın “V2” düzeni; ihtiyaç yoksa boş alanlar "" olarak dahil edilir)
 */
export function securityHashForAuth(opts: {
  orderId: string;
  amountDecimal: string;      // "2100.00"
  currency: string;           // "TRY"
  installmentCount: number;   // 1
  paymentGroup?: string;      // "PRODUCT"
  paymentChannel?: string;    // "WEB"
  callbackUrl?: string;       // return URL
}) {
  const v = TAMI.AUTH_HASH_VERSION;

  if (v === "v1") {
    const data = [
      opts.orderId,
      opts.amountDecimal,
      opts.currency,
      String(opts.installmentCount),
      TAMI.MERCHANT_ID,
      TAMI.TERMINAL_ID,
    ].join("|");
    return hmacB64(data);
  }

  // v2 (default)
  const data = [
    TAMI.MERCHANT_ID,
    TAMI.TERMINAL_ID,
    opts.orderId,
    opts.amountDecimal,
    opts.currency,
    String(opts.installmentCount),
    opts.paymentGroup ?? "PRODUCT",
    opts.paymentChannel ?? "WEB",
    opts.callbackUrl ?? "",
  ].join("|");
  return hmacB64(data);
}

/**
 * 3D dönüş hashedData doğrulaması (dokümandaki Java örneğine göre)
 * cardOrg + cardBrand + cardType + maskedNumber + installmentCount +
 * currency + originalAmount + orderId + systemTime + status
 */
export function verify3DHashedData(form: FormData) {
  const cardOrg         = String(form.get("cardOrganization") ?? form.get("cardOrg") ?? "");
  const cardBrand       = String(form.get("cardBrand") ?? "");
  const cardType        = String(form.get("cardType") ?? "");
  const maskedNumber    = String(form.get("maskedNumber") ?? "");
  const installment     = String(form.get("installmentCount") ?? "1");
  const currency        = String(form.get("currencyCode") ?? form.get("currency") ?? "TRY");
  const originalAmount  = String(form.get("originalAmount") ?? form.get("txnAmount") ?? "");
  const orderId         = String(form.get("orderId") ?? "");
  const systemTime      = String(form.get("systemTime") ?? "");
  const status          = String(form.get("success") ?? form.get("status") ?? "");
  const provided        = String(form.get("hashedData") ?? "");

  if (!provided) return { ok: true, reason: "no-hash" };

  const data = [
    cardOrg, cardBrand, cardType, maskedNumber, installment,
    currency, originalAmount, orderId, systemTime, status,
  ].join("");

  const expected = hmacB64(data);
  return { ok: expected === provided, expected, provided };
}

/** COMPLETE-3DS securityHash (çoğu kurulumda bu kadar) */
export function securityHashForComplete(orderId: string) {
  const data = [orderId, TAMI.MERCHANT_ID, TAMI.TERMINAL_ID].join("|");
  return hmacB64(data);
}
