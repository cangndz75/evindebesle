-- Add deliveryTimes configuration for dynamic /shipping delivery durations
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'CompanySettings') THEN
		EXECUTE 'ALTER TABLE "CompanySettings" ADD COLUMN IF NOT EXISTS "deliveryTimes" JSONB';
	END IF;
END $$;
