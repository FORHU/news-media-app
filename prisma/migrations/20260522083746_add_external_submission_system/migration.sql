-- AlterEnum
ALTER TYPE "SourceType" ADD VALUE 'EXTERNAL';

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_article_submissions" (
    "id" TEXT NOT NULL,
    "content_article_id" TEXT NOT NULL,
    "source_platform" TEXT NOT NULL,
    "external_article_id" TEXT NOT NULL,
    "callback_url" TEXT,
    "callback_status" TEXT,
    "callback_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_article_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "external_article_submissions_content_article_id_key" ON "external_article_submissions"("content_article_id");

-- CreateIndex
CREATE INDEX "external_article_submissions_external_article_id_idx" ON "external_article_submissions"("external_article_id");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_article_submissions" ADD CONSTRAINT "external_article_submissions_content_article_id_fkey" FOREIGN KEY ("content_article_id") REFERENCES "content_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
