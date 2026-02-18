-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "category_name" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_articles" (
    "id" SERIAL NOT NULL,
    "users_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "publish_date" TIMESTAMP(3),
    "image_url" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_articles" (
    "id" SERIAL NOT NULL,
    "content_article_id" INTEGER NOT NULL,
    "crawled_url_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "source_cites_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publish_date" TIMESTAMP(3),
    "image_url" TEXT,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawled_urls" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawled_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_cites" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_cites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_transformations" (
    "id" SERIAL NOT NULL,
    "content_article_id" INTEGER NOT NULL,
    "social_channels_id" INTEGER NOT NULL,
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
    "id" SERIAL NOT NULL,
    "social_media_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_posts" (
    "id" SERIAL NOT NULL,
    "content_transformation_id" INTEGER NOT NULL,
    "post_url" TEXT,
    "media_url" JSONB,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "crawled_urls_url_key" ON "crawled_urls"("url");

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_users_id_fkey" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_articles" ADD CONSTRAINT "content_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_articles" ADD CONSTRAINT "raw_articles_content_article_id_fkey" FOREIGN KEY ("content_article_id") REFERENCES "content_articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_articles" ADD CONSTRAINT "raw_articles_crawled_url_id_fkey" FOREIGN KEY ("crawled_url_id") REFERENCES "crawled_urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_articles" ADD CONSTRAINT "raw_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_articles" ADD CONSTRAINT "raw_articles_source_cites_id_fkey" FOREIGN KEY ("source_cites_id") REFERENCES "source_cites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_transformations" ADD CONSTRAINT "content_transformations_content_article_id_fkey" FOREIGN KEY ("content_article_id") REFERENCES "content_articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_transformations" ADD CONSTRAINT "content_transformations_social_channels_id_fkey" FOREIGN KEY ("social_channels_id") REFERENCES "social_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_content_transformation_id_fkey" FOREIGN KEY ("content_transformation_id") REFERENCES "content_transformations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
