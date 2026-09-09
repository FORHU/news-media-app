-- CreateTable
-- "General Publish" admin feature: one action fans out into one content_articles
-- row per target tenant. Deleting a general_publishes row cascades to delete
-- every content_articles row it created.
CREATE TABLE "general_publishes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "category" TEXT NOT NULL,
    "is_headline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "general_publishes_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "content_articles" ADD COLUMN "general_publish_id" TEXT;

-- CreateIndex
CREATE INDEX "content_articles_general_publish_id_idx" ON "content_articles"("general_publish_id");

-- CreateIndex
-- Guards against ever double-publishing to the same tenant from one broadcast.
CREATE UNIQUE INDEX "content_articles_general_publish_id_tenant_id_key" ON "content_articles"("general_publish_id", "tenant_id");

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_general_publish_id_fkey" FOREIGN KEY ("general_publish_id") REFERENCES "general_publishes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
