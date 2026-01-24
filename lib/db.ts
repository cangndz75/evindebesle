import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// SSL mode uyarısını önlemek için connection string'i düzenle
// Eğer sslmode yoksa veya 'prefer', 'require', 'verify-ca' ise, 'verify-full' olarak ayarla
function normalizeConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode');
    
    // Eğer sslmode yoksa veya eski modlardan biri ise, verify-full olarak ayarla
    if (!sslMode || ['prefer', 'require', 'verify-ca'].includes(sslMode)) {
      url.searchParams.set('sslmode', 'verify-full');
      return url.toString();
    }
    
    return connectionString;
  } catch {
    // URL parse edilemezse, orijinal string'i döndür
    return connectionString;
  }
}

const normalizedConnectionString = normalizeConnectionString(env.DATABASE_URL);
const pool = new Pool({ connectionString: normalizedConnectionString });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}