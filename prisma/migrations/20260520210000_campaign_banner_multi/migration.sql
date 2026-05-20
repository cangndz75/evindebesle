-- AlterTable
ALTER TABLE "CampaignBanner" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Kampanya';
ALTER TABLE "CampaignBanner" ADD COLUMN "startsAt" TIMESTAMP(3);
ALTER TABLE "CampaignBanner" ADD COLUMN "endsAt" TIMESTAMP(3);

UPDATE "CampaignBanner" SET "name" = LEFT("title", 120) WHERE "name" = 'Kampanya';
