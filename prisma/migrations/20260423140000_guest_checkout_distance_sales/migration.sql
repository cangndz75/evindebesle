-- Misafir ödeme, adres iletişim alanları, mesafeli satış onayı zaman damgası
ALTER TABLE "User" ADD COLUMN "isGuest" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "UserAddress" ADD COLUMN "email" TEXT;
ALTER TABLE "UserAddress" ADD COLUMN "phone" TEXT;
ALTER TABLE "UserAddress" ADD COLUMN "fullName" TEXT;

ALTER TABLE "Order" ADD COLUMN "distanceSalesContractAcceptedAt" TIMESTAMP(3);
