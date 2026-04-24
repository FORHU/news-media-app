-- CreateTable
CREATE TABLE "raw_twitter_articles" (
    "id" TEXT NOT NULL,
    "tweet_id" TEXT NOT NULL,
    "source_username" TEXT NOT NULL,
    "profile_url" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "tweet_timestamp" TEXT,
    "has_media" BOOLEAN NOT NULL DEFAULT false,
    "media_type" TEXT,
    "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_twitter_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_twitter_articles_tweet_id_key" ON "raw_twitter_articles"("tweet_id");
