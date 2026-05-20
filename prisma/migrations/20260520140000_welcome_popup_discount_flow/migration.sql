-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN "welcomeClaimedAt" TIMESTAMP(3),
ADD COLUMN "welcomeCouponId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_welcomeCouponId_key" ON "Subscriber"("welcomeCouponId");

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_welcomeCouponId_fkey" FOREIGN KEY ("welcomeCouponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "WelcomePopupSettings" ADD COLUMN "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENT',
ADD COLUMN "discountValue" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "codePrefix" TEXT NOT NULL DEFAULT 'WELCOME',
ADD COLUMN "couponValidDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "emailSubject" TEXT NOT NULL DEFAULT 'Dark Velvet''e Hoş Geldin! İlk Sipariş İndirimin İçeride 🎁',
ADD COLUMN "successTitle" TEXT NOT NULL DEFAULT 'Harika!',
ADD COLUMN "successMessage" TEXT NOT NULL DEFAULT 'İndirim kodunu {email} adresine gönderdik. Gelen kutunu (veya spam klasörünü) kontrol etmeyi unutma!';
