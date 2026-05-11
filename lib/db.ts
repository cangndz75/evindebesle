import "server-only";

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";
import { normalizeDatabaseUrlForPg } from "./normalize-database-url.js";
import { decryptAtRest, encryptAtRest } from "@/lib/security/at-rest-crypto";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({
  connectionString: normalizeDatabaseUrlForPg(env.DATABASE_URL),
});
const adapter = new PrismaPg(pool as any);

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

const USER_PII_FIELDS = ["phone", "fullAddress"] as const;
const ADDRESS_PII_FIELDS = ["fullAddress", "email", "phone", "fullName"] as const;

type FieldList = readonly string[];

function encryptDataObject(data: unknown, fields: FieldList): unknown {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => encryptDataObject(item, fields));
  }

  const cloned: Record<string, unknown> = { ...(data as Record<string, unknown>) };

  for (const field of fields) {
    const value = cloned[field];
    if (typeof value === "string") {
      cloned[field] = encryptAtRest(value);
      continue;
    }

    if (
      value &&
      typeof value === "object" &&
      "set" in (value as Record<string, unknown>) &&
      typeof (value as Record<string, unknown>).set === "string"
    ) {
      cloned[field] = {
        ...(value as Record<string, unknown>),
        set: encryptAtRest((value as Record<string, string>).set),
      };
    }
  }

  return cloned;
}

function decryptResultObject(result: unknown, fields: FieldList): unknown {
  if (!result || typeof result !== "object") return result;

  if (Array.isArray(result)) {
    return result.map((item) => decryptResultObject(item, fields));
  }

  const cloned: Record<string, unknown> = { ...(result as Record<string, unknown>) };
  for (const field of fields) {
    const value = cloned[field];
    if (typeof value === "string") {
      try {
        cloned[field] = decryptAtRest(value);
      } catch {
        cloned[field] = value;
      }
    }
  }

  return cloned;
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        const userModel = model === "User";
        const addressModel = model === "UserAddress";

        if (!userModel && !addressModel) {
          return query(args);
        }

        const piiFields = userModel ? USER_PII_FIELDS : ADDRESS_PII_FIELDS;

        if (["create", "update", "upsert"].includes(operation || "")) {
          if (args?.data) {
            args.data = encryptDataObject(args.data, piiFields);
          }
          if (args?.create) {
            args.create = encryptDataObject(args.create, piiFields);
          }
          if (args?.update) {
            args.update = encryptDataObject(args.update, piiFields);
          }
        }

        if (["createMany", "updateMany"].includes(operation || "") && args?.data) {
          args.data = encryptDataObject(args.data, piiFields);
        }

        const result = await query(args);
        return decryptResultObject(result, piiFields);
      },
    },
  },
}) as any;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}
