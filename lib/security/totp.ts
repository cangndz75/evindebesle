import "server-only";

import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Buffer): string {
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");

  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    out += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return out;
}

function base32Decode(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = "";
  for (const ch of normalized) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    bits += idx.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secretBase32: string, counter: number, digits = 6): string {
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 10 ** digits).toString().padStart(digits, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function verifyTotpToken(secretBase32: string, token: string, periodSeconds = 30): boolean {
  const cleanToken = token.replace(/\s+/g, "").trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const nowCounter = Math.floor(Date.now() / 1000 / periodSeconds);
  for (const drift of [-1, 0, 1]) {
    const expected = hotp(secretBase32, nowCounter + drift, 6);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleanToken))) {
      return true;
    }
  }

  return false;
}

export function buildOtpAuthUri(email: string, secretBase32: string): string {
  const issuer = "Dark Velvet";
  const label = `${issuer}:${email}`;
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString("hex").toUpperCase());
}

export function hashBackupCode(code: string): string {
  const pepper = process.env.ADMIN_MFA_BACKUP_PEPPER || process.env.AUTH_SECRET || "fallback-pepper";
  return crypto.createHash("sha256").update(`${pepper}:${code.trim().toUpperCase()}`, "utf8").digest("hex");
}
