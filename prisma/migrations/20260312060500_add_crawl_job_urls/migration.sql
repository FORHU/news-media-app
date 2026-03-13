-- AlterTable
ALTER TABLE "crawl_jobs"
ADD COLUMN IF NOT EXISTS "urls" TEXT[] NOT NULL DEFAULT '{}';

