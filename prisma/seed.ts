import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { SourceType } from "../src/generated/prisma";
import { prisma } from "../src/lib/db";

const syncTableOrder = [
  "tenants",
  "users",
  "categories",
  "subscribers",
  "subscriber_preferences",
  "crawl_jobs",
  "crawled_urls",
  "raw_tweets",
  "raw_videos",
  "raw_source_uploads",
  "raw_articles",
  "content_articles",
  "social_channels",
  "content_transformations",
  "social_media_posts",
  "banners",
] as const;

function randomPassword(length = 16): string {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}

async function mirrorPublicToNewsIcons(): Promise<void> {
  for (const table of syncTableOrder) {
    if (table === "content_articles") {
      await prisma.$executeRawUnsafe(`
        INSERT INTO news_icons.content_articles (
          id,
          tenant_id,
          users_id,
          category_id,
          raw_article_id,
          raw_tweets_id,
          raw_youtube_id,
          raw_source_uploads_id,
          title,
          slug,
          publish_date,
          image_url,
          content,
          youtube_url,
          source_type,
          status,
          created_at,
          updated_at
        )
        SELECT
          id,
          tenant_id,
          users_id,
          category_id,
          raw_article_id,
          raw_tweets_id,
          raw_youtube_id,
          raw_source_uploads_id,
          title,
          slug,
          publish_date,
          image_url,
          content,
          youtube_url,
          source_type::text::news_icons."SourceType",
          status,
          created_at,
          updated_at
        FROM public.content_articles
        ON CONFLICT DO NOTHING
      `);
      continue;
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO news_icons.${table} SELECT * FROM public.${table} ON CONFLICT DO NOTHING`
    );
  }
}

async function main() {
  console.log("Seeding all tables...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "seed-tenant" },
    update: {
      domain: "seed.localhost",
      siteName: "Seed News",
      defaultLanguage: "en",
      logoUrl: "https://placehold.co/200x80/png",
      faviconUrl: "https://placehold.co/32x32/png",
      isActive: true,
    },
    create: {
      slug: "seed-tenant",
      domain: "seed.localhost",
      siteName: "Seed News",
      defaultLanguage: "en",
      logoUrl: "https://placehold.co/200x80/png",
      faviconUrl: "https://placehold.co/32x32/png",
      isActive: true,
    },
  });

  const adminEmail = "admin@seed.local";
  const rawPassword = randomPassword(14);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const existingAdmin = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
  });
  const admin = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          firstName: "Seed",
          lastName: "Admin",
          role: "admin",
          password: hashedPassword,
        },
      })
    : await prisma.user.create({
        data: {
          tenantId: tenant.id,
          firstName: "Seed",
          lastName: "Admin",
          email: adminEmail,
          password: hashedPassword,
          role: "admin",
        },
      });

  const category = await prisma.category.upsert({
    where: { tenantId_categoryName: { tenantId: tenant.id, categoryName: "General" } },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryName: "General",
    },
  });

  const subscriber = await prisma.subscriber.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: "subscriber@seed.local" },
    },
    update: {
      isVerified: true,
      attempts: 0,
      otpCode: null,
      expiresAt: null,
      lastOtpSentAt: null,
    },
    create: {
      tenantId: tenant.id,
      email: "subscriber@seed.local",
      isVerified: true,
      attempts: 0,
    },
  });

  await prisma.subscriberPreference.upsert({
    where: {
      subscriber_category_unique: {
        subscriberId: subscriber.id,
        categoryId: category.id,
      },
    },
    update: {},
    create: {
      subscriberId: subscriber.id,
      categoryId: category.id,
    },
  });

  const crawlJob = await prisma.crawlJob.create({
    data: {
      tenantId: tenant.id,
      status: "COMPLETED",
      urls: ["https://example.com/seed-article"],
      maxArticlesRequest: 5,
      articlesSaved: 1,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  const crawledUrl = await prisma.crawledUrl.upsert({
    where: {
      tenantId_url: {
        tenantId: tenant.id,
        url: "https://example.com/seed-article",
      },
    },
    update: { status: "crawled" },
    create: {
      tenantId: tenant.id,
      url: "https://example.com/seed-article",
      status: "crawled",
    },
  });

  const rawArticle = await prisma.rawArticle.create({
    data: {
      tenantId: tenant.id,
      crawledUrlId: crawledUrl.id,
      categoryId: category.id,
      crawlJobId: crawlJob.id,
      title: "Seed Raw Article",
      author: "Seed Bot",
      publishDate: new Date(),
      imageUrl: "https://placehold.co/1200x675/png",
      content: "Seeded raw article content.",
      status: "pending",
    },
  });

  const rawTweet = await prisma.rawTweet.upsert({
    where: { tweetId: "seed-tweet-0001" },
    update: {
      tenantId: tenant.id,
      sourceName: "SeedBot",
      profileUrl: "https://x.com/seedbot",
      text: "Seed tweet source content.",
      tweetTimestamp: new Date().toISOString(),
      hasMedia: true,
      mediaType: "image",
      mediaUrls: ["https://placehold.co/1200x675/png"],
      thumbnailUrl: "https://placehold.co/600x338/png",
      status: "pending",
    },
    create: {
      tenantId: tenant.id,
      tweetId: "seed-tweet-0001",
      sourceName: "SeedBot",
      profileUrl: "https://x.com/seedbot",
      text: "Seed tweet source content.",
      tweetTimestamp: new Date().toISOString(),
      hasMedia: true,
      mediaType: "image",
      mediaUrls: ["https://placehold.co/1200x675/png"],
      thumbnailUrl: "https://placehold.co/600x338/png",
      status: "pending",
    },
  });

  const existingRawVideo = await prisma.rawVideo.findFirst({
    where: { tenantId: tenant.id, youtubeUrl: "https://www.youtube.com/watch?v=seed0001" },
  });
  const rawVideo = existingRawVideo
    ? await prisma.rawVideo.update({
        where: { id: existingRawVideo.id },
        data: {
          language: "en",
          transcribedContent: "Seed video transcript content.",
          prompt: "Summarize this video.",
        },
      })
    : await prisma.rawVideo.create({
        data: {
          tenantId: tenant.id,
          language: "en",
          youtubeUrl: "https://www.youtube.com/watch?v=seed0001",
          transcribedContent: "Seed video transcript content.",
          prompt: "Summarize this video.",
        },
      });

  const existingRawSourceUpload = await prisma.rawSourceUpload.findFirst({
    where: {
      tenantId: tenant.id,
      s3ImageUrl: "https://placehold.co/1000x600/png",
    },
  });
  const rawSourceUpload = existingRawSourceUpload
    ? await prisma.rawSourceUpload.update({
        where: { id: existingRawSourceUpload.id },
        data: {
          prompt: "Generate article from uploaded file.",
          language: "en",
          extractedText: "Seed OCR/extracted text from upload.",
        },
      })
    : await prisma.rawSourceUpload.create({
        data: {
          tenantId: tenant.id,
          prompt: "Generate article from uploaded file.",
          s3ImageUrl: "https://placehold.co/1000x600/png",
          language: "en",
          extractedText: "Seed OCR/extracted text from upload.",
        },
      });

  const contentArticle = await prisma.contentArticle.upsert({
    where: { slug: "seed-content-article" },
    update: {
      tenantId: tenant.id,
      usersId: admin.id,
      categoryId: category.id,
      rawArticleId: rawArticle.id,
      title: "Seed Content Article",
      publishDate: new Date(),
      imageUrl: "https://placehold.co/1200x675/png",
      content: "Seeded published content article.",
      sourceType: SourceType.ARTICLE,
      status: "published",
    },
    create: {
      tenantId: tenant.id,
      usersId: admin.id,
      categoryId: category.id,
      rawArticleId: rawArticle.id,
      title: "Seed Content Article",
      slug: "seed-content-article",
      publishDate: new Date(),
      imageUrl: "https://placehold.co/1200x675/png",
      content: "Seeded published content article.",
      sourceType: SourceType.ARTICLE,
      status: "published",
    },
  });

  const existingSocialChannel = await prisma.socialChannel.findFirst({
    where: { tenantId: tenant.id, socialMediaName: "X" },
  });
  const socialChannel = existingSocialChannel
    ? existingSocialChannel
    : await prisma.socialChannel.create({
        data: {
          tenantId: tenant.id,
          socialMediaName: "X",
        },
      });

  const transformation = await prisma.contentTransformation.create({
    data: {
      contentArticleId: contentArticle.id,
      socialChannelsId: socialChannel.id,
      tone: "neutral",
      formatType: "thread",
      transformedTitle: "Seed Transformation Title",
      transformedContent: "Seed transformation content.",
      status: "ready",
    },
  });

  await prisma.socialMediaPost.create({
    data: {
      contentTransformationId: transformation.id,
      postUrl: "https://x.com/seed/status/0001",
      mediaUrl: ["https://placehold.co/1200x675/png"],
      postedAt: new Date(),
    },
  });

  await prisma.banner.create({
    data: {
      tenantId: tenant.id,
      name: "Seed Homepage Banner",
      imageUrl: "https://placehold.co/1400x300/png",
      linkUrl: "https://example.com/seed",
      altText: "Seed banner",
      positions: ["home-top"],
      isActive: true,
    },
  });

  console.log("\nSeed completed.");
  console.log(`Tenant ID: ${tenant.id}`);
  console.log(`Admin ID: ${admin.id}`);
  console.log(`Admin email: ${adminEmail}`);
  console.log(
    `Admin password (newly generated this run): ${rawPassword}`
  );
  console.log(
    `Raw source IDs: ${rawArticle.id}, ${rawTweet.id}, ${rawVideo.id}, ${rawSourceUpload.id}`
  );
  await mirrorPublicToNewsIcons();
  console.log("Mirrored seeded rows from public to news_icons.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
