-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('ARTICLE', 'TWEET', 'VIDEO', 'UPLOAD', 'MANUAL');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "default_language" TEXT NOT NULL DEFAULT 'en',
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "otp_code" TEXT,
    "last_otp_sent_at" TIMESTAMP(3),

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber_preferences" (
    "id" TEXT NOT NULL,
    "subscriber_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriber_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_articles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "users_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "raw_article_id" TEXT,
    "raw_tweets_id" TEXT,
    "raw_youtube_id" TEXT,
    "raw_source_uploads_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "publish_date" TIMESTAMP(3),
    "image_url" TEXT,
    "content" TEXT NOT NULL,
    "youtube_url" TEXT,
    "source_type" "SourceType" NOT NULL DEFAULT 'ARTICLE',
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "view_count" INTEGER DEFAULT 0,
    "trending_score" DOUBLE PRECISION DEFAULT 0.0,
    "is_headline" BOOLEAN DEFAULT false,

    CONSTRAINT "content_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_articles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "crawled_url_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "crawl_jobs_id" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publish_date" TIMESTAMP(3),
    "image_url" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_tweets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tweet_id" TEXT NOT NULL,
    "source_name" TEXT,
    "profile_url" TEXT,
    "text" TEXT NOT NULL,
    "tweet_timestamp" TEXT,
    "has_media" BOOLEAN NOT NULL DEFAULT false,
    "media_type" TEXT,
    "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "generation_mode" TEXT DEFAULT 'standalone',

    CONSTRAINT "raw_tweets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_videos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "language" TEXT,
    "youtube_url" TEXT NOT NULL,
    "transcribed_content" TEXT NOT NULL,
    "prompt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "generation_mode" TEXT DEFAULT 'standalone',

    CONSTRAINT "raw_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_source_uploads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "prompt" TEXT,
    "s3_image_url" TEXT,
    "language" TEXT,
    "extracted_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_source_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_articles_request" INTEGER NOT NULL DEFAULT 10,
    "articles_saved" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawled_urls" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawled_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_transformations" (
    "id" TEXT NOT NULL,
    "content_article_id" TEXT NOT NULL,
    "social_channels_id" TEXT NOT NULL,
    "tone" TEXT,
    "format_type" TEXT,
    "transformed_title" TEXT,
    "transformed_content" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_transformations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_channels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "social_media_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_posts" (
    "id" TEXT NOT NULL,
    "content_transformation_id" TEXT NOT NULL,
    "post_url" TEXT,
    "media_url" JSONB,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "banner_type" TEXT NOT NULL DEFAULT 'IMAGE',
    "image_url" TEXT,
    "youtube_url" TEXT,
    "link_url" TEXT NOT NULL,
    "alt_text" TEXT,
    "positions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_category_name_key" ON "categories"("tenant_id", "category_name");

-- CreateIndex
CREATE INDEX "subscribers_tenant_id_idx" ON "subscribers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_tenant_id_email_key" ON "subscribers"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_preferences_subscriber_id_category_id_key" ON "subscriber_preferences"("subscriber_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_articles_raw_article_id_key" ON "content_articles"("raw_article_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_articles_raw_tweets_id_key" ON "content_articles"("raw_tweets_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_articles_raw_youtube_id_key" ON "content_articles"("raw_youtube_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_articles_raw_source_uploads_id_key" ON "content_articles"("raw_source_uploads_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_articles_slug_key" ON "content_articles"("slug");

-- CreateIndex
CREATE INDEX "content_articles_tenant_id_idx" ON "content_articles"("tenant_id");

-- CreateIndex
CREATE INDEX "raw_articles_tenant_id_idx" ON "raw_articles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "raw_tweets_tweet_id_key" ON "raw_tweets"("tweet_id");

-- CreateIndex
CREATE INDEX "raw_tweets_tenant_id_idx" ON "raw_tweets"("tenant_id");

-- CreateIndex
CREATE INDEX "raw_videos_tenant_id_idx" ON "raw_videos"("tenant_id");

-- CreateIndex
CREATE INDEX "raw_source_uploads_tenant_id_idx" ON "raw_source_uploads"("tenant_id");

-- CreateIndex
CREATE INDEX "crawl_jobs_tenant_id_idx" ON "crawl_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "crawled_urls_tenant_id_idx" ON "crawled_urls"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "crawled_urls_tenant_id_url_key" ON "crawled_urls"("tenant_id", "url");

-- CreateIndex
CREATE INDEX "social_channels_tenant_id_idx" ON "social_channels"("tenant_id");

-- CreateIndex
CREATE INDEX "banners_tenant_id_idx" ON "banners"("tenant_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriber_preferences" ADD CONSTRAINT "subscriber_preferences_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriber_preferences" ADD CONSTRAINT "subscriber_preferences_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_raw_article_id_fkey" FOREIGN KEY ("raw_article_id") REFERENCES "raw_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_raw_source_uploads_id_fkey" FOREIGN KEY ("raw_source_uploads_id") REFERENCES "raw_source_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_raw_tweets_id_fkey" FOREIGN KEY ("raw_tweets_id") REFERENCES "raw_tweets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_raw_youtube_id_fkey" FOREIGN KEY ("raw_youtube_id") REFERENCES "raw_videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_articles" ADD CONSTRAINT "raw_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_articles" ADD CONSTRAINT "raw_articles_crawl_jobs_id_fkey" FOREIGN KEY ("crawl_jobs_id") REFERENCES "crawl_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_articles" ADD CONSTRAINT "raw_articles_crawled_url_id_fkey" FOREIGN KEY ("crawled_url_id") REFERENCES "crawled_urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_articles" ADD CONSTRAINT "raw_articles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_tweets" ADD CONSTRAINT "raw_tweets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_videos" ADD CONSTRAINT "raw_videos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_source_uploads" ADD CONSTRAINT "raw_source_uploads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_jobs" ADD CONSTRAINT "crawl_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawled_urls" ADD CONSTRAINT "crawled_urls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_transformations" ADD CONSTRAINT "content_transformations_content_article_id_fkey" FOREIGN KEY ("content_article_id") REFERENCES "content_articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_transformations" ADD CONSTRAINT "content_transformations_social_channels_id_fkey" FOREIGN KEY ("social_channels_id") REFERENCES "social_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_channels" ADD CONSTRAINT "social_channels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_content_transformation_id_fkey" FOREIGN KEY ("content_transformation_id") REFERENCES "content_transformations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
