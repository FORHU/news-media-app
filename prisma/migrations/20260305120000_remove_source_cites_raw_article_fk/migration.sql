-- DropForeignKey: raw_articles.content_article_id -> content_articles
ALTER TABLE "raw_articles" DROP CONSTRAINT IF EXISTS "raw_articles_content_article_id_fkey";

-- DropForeignKey: raw_articles.source_cites_id -> source_cites
ALTER TABLE "raw_articles" DROP CONSTRAINT IF EXISTS "raw_articles_source_cites_id_fkey";

-- DropColumn: content_article_id from raw_articles
ALTER TABLE "raw_articles" DROP COLUMN IF EXISTS "content_article_id";

-- DropColumn: source_cites_id from raw_articles
ALTER TABLE "raw_articles" DROP COLUMN IF EXISTS "source_cites_id";

-- DropTable: source_cites
DROP TABLE IF EXISTS "source_cites";

-- AddColumn: raw_article_id to content_articles (nullable, unique, FK to raw_articles)
ALTER TABLE "content_articles" ADD COLUMN IF NOT EXISTS "raw_article_id" TEXT;

-- CreateUniqueIndex for raw_article_id (one content_article per raw_article)
CREATE UNIQUE INDEX IF NOT EXISTS "content_articles_raw_article_id_key" ON "content_articles"("raw_article_id");

-- AddForeignKey: content_articles.raw_article_id -> raw_articles.id
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_raw_article_id_fkey" FOREIGN KEY ("raw_article_id") REFERENCES "raw_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
