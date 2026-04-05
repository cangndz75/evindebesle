import crypto from "crypto";
import { CompactSign } from "jose";

function getJwkResource() {
  const kid = (process.env.TAMI_FIXED_KID_VALUE || "").trim();
  const k = (process.env.TAMI_FIXED_K_VALUE || "").trim();

  if (!kid || !k) {
    throw new Error("Missing TAMI_FIXED_KID_VALUE or TAMI_FIXED_K_VALUE");
  }

  return { kid, k };
}

export async function generateSecurityHashV2(input: any): Promise<string> {
  const { kid, k } = getJwkResource();

  const payloadObj =
    input && typeof input === "object"
      ? JSON.parse(JSON.stringify(input, (key, value) => (key === "securityHash" ? undefined : value)))
      : input;

  const protectedHeader = { alg: "HS512" as const, typ: "JWT" as const, kid };
  const key = crypto.createSecretKey(Buffer.from(k, "base64"));
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8");

  const jws = await new CompactSign(payload)
    .setProtectedHeader(protectedHeader)
    .sign(key);

  return jws;
}

export async function securityHashForComplete(orderId: string): Promise<string> {
  const payload = { orderId };
  return generateSecurityHashV2(payload);
}
