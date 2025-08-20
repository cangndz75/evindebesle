export const TAMI = {
  BASE_URL: process.env.TAMI_BASE_URL ?? "https://sandbox-paymentapi.tami.com.tr",
  MERCHANT_ID: process.env.TAMI_MERCHANT_ID ?? "77006950",
  TERMINAL_ID: process.env.TAMI_TERMINAL_ID ?? "84006953",
  SECRET_KEY: process.env.TAMI_SECRET_KEY ?? "0edad05a-7ea7-40f1-a80c-d600121ca51b",
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:3000",
  AUTH_HASH_VERSION: (process.env.TAMI_AUTH_HASH_VERSION ?? "v2").toLowerCase(),
};

export function tamiHeaders() {
  return {
    "Content-Type": "application/json",
    merchantId: TAMI.MERCHANT_ID,
    terminalId: TAMI.TERMINAL_ID,
  };
}
