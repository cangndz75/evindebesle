-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminMfaBackupCodes" TEXT,
ADD COLUMN     "adminMfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminMfaEnabledAt" TIMESTAMP(3),
ADD COLUMN     "adminMfaSecret" TEXT;
