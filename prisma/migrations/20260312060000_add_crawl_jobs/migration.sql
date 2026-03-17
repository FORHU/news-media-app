-- CreateTable
CREATE TABLE IF NOT EXISTS "crawl_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "max_articles_request" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "started_at" TIMESTAMPTZ,
    "finished_at" TIMESTAMPTZ,

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "raw_articles" ADD COLUMN IF NOT EXISTS "crawl_jobs_id" UUID;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'raw_articles_crawl_jobs_id_fkey'
  ) THEN
    ALTER TABLE "raw_articles"
      ADD CONSTRAINT "raw_articles_crawl_jobs_id_fkey"
      FOREIGN KEY ("crawl_jobs_id") REFERENCES "crawl_jobs"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

