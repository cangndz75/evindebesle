-- Add announcementMessages configuration for rotating top banner campaigns
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'CompanySettings'
    ) THEN
        EXECUTE 'ALTER TABLE "CompanySettings" ADD COLUMN IF NOT EXISTS "announcementMessages" JSONB';
    END IF;
END $$;
