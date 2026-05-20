-- CreateTable
CREATE TABLE "CampaignBanner" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "badgeText" TEXT,
    "title" TEXT NOT NULL DEFAULT 'BAYRAM İNDİRİMLERİ BAŞLADI',
    "description" TEXT,
    "buttonText" TEXT,
    "buttonUrl" TEXT,
    "subNote" TEXT,
    "discountTiers" JSONB,
    "themeColor" TEXT NOT NULL DEFAULT 'olive',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignBanner_pkey" PRIMARY KEY ("id")
);
