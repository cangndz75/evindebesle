import crypto from "crypto";

const SIGNATURE_HEADERS = [
  "x-iyzi-signature-v3",
  "x-iyz-signature-v3",
  "x-signature",
];

function safeCompareHex(expectedHex: string, providedHex: string) {
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const provided = Buffer.from(providedHex, "hex");
    if (expected.length !== provided.length) return false;
    return crypto.timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export function verifyIyzicoWebhookSignature(req: Request, rawBody: string) {
  const secret = process.env.IYZICO_WEBHOOK_SECRET || process.env.IYZICO_SECRET_KEY;
  if (!secret) {
    return {
      ok: false,
      reason: "MISSING_WEBHOOK_SECRET",
    } as const;
  }

  const signature = SIGNATURE_HEADERS
    .map((h) => req.headers.get(h))
    .find((v) => typeof v === "string" && v.length > 0)
    ?.trim();

  if (!signature) {
    return {
      ok: false,
      reason: "MISSING_SIGNATURE_HEADER",
    } as const;
  }

  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const valid = safeCompareHex(expectedHex, signature);
  return valid
    ? ({ ok: true } as const)
    : ({ ok: false, reason: "INVALID_SIGNATURE" } as const);
}
