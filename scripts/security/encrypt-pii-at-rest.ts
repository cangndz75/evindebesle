import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizeDatabaseUrlForPg } from "../../lib/normalize-database-url.js";

type UserRaw = {
  id: string;
  phone: string | null;
  fullAddress: string | null;
};

type AddressRaw = {
  id: string;
  fullAddress: string | null;
  email: string | null;
  phone: string | null;
  fullName: string | null;
};

const ENC_PREFIX = "enc:v1:";

function deriveKey(): Buffer {
  const explicit = process.env.DATA_ENCRYPTION_KEY?.trim();
  if (explicit) {
    if (/^[A-Fa-f0-9]{64}$/.test(explicit)) return Buffer.from(explicit, "hex");

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
    throw new Error("DATA_ENCRYPTION_KEY or AUTH_SECRET is required");
  }

  return crypto.createHash("sha256").update(fallback, "utf8").digest();
}

function isEncryptedAtRest(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

function encryptAtRest(plainText: string): string {
  if (!plainText) return plainText;
  if (isEncryptedAtRest(plainText)) return plainText;

  const iv = crypto.randomBytes(12);
  const key = deriveKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const cipherText = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("base64")}.${authTag.toString("base64")}.${cipherText.toString("base64")}`;
}

const pool = new Pool({
  connectionString: normalizeDatabaseUrlForPg(process.env.DATABASE_URL),
});

const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter }) as any;

function needsEncrypt(value: string | null): value is string {
  return typeof value === "string" && value.length > 0 && !isEncryptedAtRest(value);
}

async function migrateUsers() {
  const users = (await prisma.$queryRawUnsafe(
    'SELECT "id", "phone", "fullAddress" FROM "User"'
  )) as UserRaw[];

  let changed = 0;
  for (const row of users) {
    const data: Record<string, string> = {};
    if (needsEncrypt(row.phone)) data.phone = encryptAtRest(row.phone);
    if (needsEncrypt(row.fullAddress)) data.fullAddress = encryptAtRest(row.fullAddress);

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: row.id }, data });
      changed += 1;
    }
  }

  return { total: users.length, changed };
}

async function migrateAddresses() {
  const addresses = (await prisma.$queryRawUnsafe(
    'SELECT "id", "fullAddress", "email", "phone", "fullName" FROM "UserAddress"'
  )) as AddressRaw[];

  let changed = 0;
  for (const row of addresses) {
    const data: Record<string, string> = {};
    if (needsEncrypt(row.fullAddress)) data.fullAddress = encryptAtRest(row.fullAddress);
    if (needsEncrypt(row.email)) data.email = encryptAtRest(row.email);
    if (needsEncrypt(row.phone)) data.phone = encryptAtRest(row.phone);
    if (needsEncrypt(row.fullName)) data.fullName = encryptAtRest(row.fullName);

    if (Object.keys(data).length > 0) {
      await prisma.userAddress.update({ where: { id: row.id }, data });
      changed += 1;
    }
  }

  return { total: addresses.length, changed };
}

async function main() {
  const [users, addresses] = await Promise.all([migrateUsers(), migrateAddresses()]);

  console.log("[encrypt-pii] User:", users);
  console.log("[encrypt-pii] UserAddress:", addresses);
}

main()
  .catch((error) => {
    console.error("[encrypt-pii] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
