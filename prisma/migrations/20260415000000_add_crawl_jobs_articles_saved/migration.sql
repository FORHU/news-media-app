-- AlterTable
ALTER TABLE "crawl_jobs" ADD COLUMN IF NOT EXISTS "articles_saved" INTEGER DEFAULT 0;
