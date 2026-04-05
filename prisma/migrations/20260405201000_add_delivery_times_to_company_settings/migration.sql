-- Add deliveryTimes configuration for dynamic /shipping delivery durations
ALTER TABLE "CompanySettings"
ADD COLUMN IF NOT EXISTS "deliveryTimes" JSONB;
