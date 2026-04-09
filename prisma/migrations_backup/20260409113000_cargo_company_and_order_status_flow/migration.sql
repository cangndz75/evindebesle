-- CreateTable
CREATE TABLE IF NOT EXISTS "CargoCompany" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "trackingUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CargoCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CargoCompany_code_key" ON "CargoCompany"("code");
CREATE INDEX IF NOT EXISTS "CargoCompany_code_idx" ON "CargoCompany"("code");
CREATE INDEX IF NOT EXISTS "CargoCompany_isActive_idx" ON "CargoCompany"("isActive");

-- AlterEnum (backward-compatible additions)
DO $$
BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "cargoCompanyId" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_cargoCompanyId_idx" ON "Order"("cargoCompanyId");

-- AddForeignKey
DO $$
BEGIN
  ALTER TABLE "Order"
    ADD CONSTRAINT "Order_cargoCompanyId_fkey"
    FOREIGN KEY ("cargoCompanyId") REFERENCES "CargoCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed defaults
INSERT INTO "CargoCompany" ("name", "code", "trackingUrl", "updatedAt")
VALUES
  ('Aras Kargo', 'aras', 'https://kargotakip.araskargo.com.tr/mainpage.aspx?code={trackingNumber}', NOW()),
  ('Yurtici Kargo', 'yurtici', 'https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={trackingNumber}', NOW()),
  ('Trendyol Express', 'trendyolexpress', 'https://www.trendyol.com/kargo-takip?trackingNumber={trackingNumber}', NOW())
ON CONFLICT ("code") DO NOTHING;