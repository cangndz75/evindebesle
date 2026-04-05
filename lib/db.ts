import "server-only";

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";
import { normalizeDatabaseUrlForPg } from "./normalize-database-url.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new Pool({
  connectionString: normalizeDatabaseUrlForPg(env.DATABASE_URL),
});
const adapter = new PrismaPg(pool as any);

export const prisma =
  (globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log: ["error", "warn"],
    })) as any;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}