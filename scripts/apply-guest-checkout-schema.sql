-- Misafir checkout + mesafeli satış kolonları (Neon / psql ile idempotent uygulama)
-- Tercih: yerelde `npx prisma migrate deploy` (aynı migration klasöründen).
-- Bu dosyayı yalnızca migrate çalıştıramıyorsanız veya kolonları elle eklemeniz gerekiyorsa kullanın.
-- Elle çalıştırdıktan sonra Prisma geçmişini eşitlemek için:
--   npx prisma migrate resolve --applied "20260423140000_guest_checkout_distance_sales"

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isGuest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "UserAddress" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "UserAddress" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "UserAddress" ADD COLUMN IF NOT EXISTS "fullName" TEXT;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "distanceSalesContractAcceptedAt" TIMESTAMP(3);
