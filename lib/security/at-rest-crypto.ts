import "server-only";

import crypto from "crypto";

const ENC_PREFIX = "enc:v1:";

function deriveKey(): Buffer {
  const explicit = process.env.DATA_ENCRYPTION_KEY?.trim();
  if (explicit) {
    if (/^[A-Fa-f0-9]{64}$/.test(explicit)) {
      return Buffer.from(explicit, "hex");
    }

    try {
      const asBase64 = Buffer.from(explicit, "base64");
      if (asBase64.length === 32) return asBase64;
    } catch {
      // noop
    }

    return crypto.createHash("sha256").update(explicit, "utf8").digest();
  }

  const fallback = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!fallback) {
    throw new Error("Missing encryption secret. Set DATA_ENCRYPTION_KEY or AUTH_SECRET.");
  }

  return crypto.createHash("sha256").update(fallback, "utf8").digest();
}

function getKey() {
  return deriveKey();
}

export function isEncryptedAtRest(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

export function encryptAtRest(plainText: string): string {
  if (!plainText) return plainText;
  if (isEncryptedAtRest(plainText)) return plainText;

  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const cipherText = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("base64")}.${authTag.toString("base64")}.${cipherText.toString("base64")}`;
}

export function decryptAtRest(value: string | null | undefined): string | null | undefined {
  if (value == null) return value;
  if (!isEncryptedAtRest(value)) return value;

  const payload = value.slice(ENC_PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload format");
  }

  const key = getKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const plain = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");

  return plain;
}
