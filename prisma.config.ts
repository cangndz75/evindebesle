import path from "node:path";
import "dotenv/config";

// Prisma 7 için config dosyası
// Not: Prisma 7 kullanıyorsanız, prisma paketini güncelleyin: npm install prisma@latest
// import { defineConfig, env } from "prisma/config";

// Prisma 7 formatı (defineConfig kullanılırsa type-safe olur)
// Şimdilik basit obje formatı kullanıyoruz
export default {
  schema: path.join(process.cwd(), "prisma", "schema.prisma"),
  migrations: { 
    path: path.join(process.cwd(), "prisma", "migrations") 
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
