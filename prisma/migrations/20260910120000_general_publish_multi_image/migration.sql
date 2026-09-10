-- AlterTable
-- General Publish's manual-entry flow can now attach multiple images per
-- broadcast (mirrors the existing content_articles.image_urls column).
ALTER TABLE "general_publishes" ADD COLUMN "image_urls" TEXT[] NOT NULL DEFAULT '{}';
