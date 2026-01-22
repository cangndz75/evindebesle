import path from "node:path";
import "dotenv/config";

// Prisma 7 için config dosyası
// Not: Prisma 7 için Node.js 20.19+ veya 22.12+ gereklidir
export default {
  schema: path.join(process.cwd(), "prisma", "schema.prisma"),
  migrations: { 
    path: path.join(process.cwd(), "prisma", "migrations") 
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
