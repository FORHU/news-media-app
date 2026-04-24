/**
 * Prisma seed. Run: npx prisma db seed
 * Requires: DATABASE_URL in .env. Run after: npx prisma migrate dev or npx prisma db push
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { articles } from "./seeder/articles";
import { seedUsers } from "./seeder/users";
import { seedCategories } from "./seeder/categories";
import { seedArticles } from "./seeder/articles";
import { seedCrawledUrls } from "./seeder/crawledUrls";
import { seedSocialChannels } from "./seeder/socialChannels";
import { seedRawArticles } from "./seeder/rawArticles";
import { seedRawTweets } from "./seeder/rawTweets";
import { seedRawVideos } from "./seeder/rawVideos";
import { seedRawSourceUploads } from "./seeder/rawSourceUploads";
import { seedTransformations } from "./seeder/transformations";
import { seedSocialMediaPosts } from "./seeder/socialMediaPosts";

async function main() {
  console.log("🌱 Starting seed...");

  if (!prisma) {
    throw new Error("DATABASE_URL is not set. Add it to .env");
  }

  const userIds = await seedUsers(prisma);
  const userId = userIds[0];
  if (userId == null) throw new Error("No user id for seeding articles");

  const categoryNames = [...new Set(articles.map((a) => a.categoryName))];
  const categoryMap = await seedCategories(prisma, categoryNames);

  const crawledUrlIds = await seedCrawledUrls(prisma);
  const socialChannelIds = await seedSocialChannels(prisma);

  const rawArticleIds = await seedRawArticles(prisma, categoryMap, crawledUrlIds);
  const contentArticleIds = await seedArticles(
    prisma,
    userId,
    categoryMap,
    rawArticleIds
  );

  // Seed additional source tables (tweet/video/upload) and link them to content articles.
  const [rawTweetIds, rawVideoIds, rawSourceUploadIds] = await Promise.all([
    seedRawTweets(prisma),
    seedRawVideos(prisma),
    seedRawSourceUploads(prisma),
  ]);

  const makeCuid = () =>
    `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random()
      .toString(36)
      .slice(2, 10)}`.slice(0, 25);

  const categoryIdForExtras = Object.values(categoryMap)[0] ?? null;

  if (categoryIdForExtras) {
    // Tweet-based article
    if (rawTweetIds[0]) {
      const id = makeCuid();
      await prisma.$executeRaw`
        INSERT INTO content_articles (
          id,
          users_id,
          category_id,
          raw_tweets_id,
          title,
          content,
          image_url,
          status,
          source_type,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${userId},
          ${categoryIdForExtras},
          ${rawTweetIds[0]},
          ${"Tweet roundup: What people are talking about"},
          ${"This is sample generated content sourced from a tweet. Replace with real AI output later."},
          ${"https://placehold.co/1200x675/png"},
          ${"pending"},
          ${"TWEET"}::"SourceType",
          now(),
          now()
        )
      `;
      contentArticleIds.push(id);
    }

    // Video-based article
    if (rawVideoIds[0]) {
      const id = makeCuid();
      await prisma.$executeRaw`
        INSERT INTO content_articles (
          id,
          users_id,
          category_id,
          raw_youtube_id,
          title,
          content,
          youtube_url,
          status,
          source_type,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${userId},
          ${categoryIdForExtras},
          ${rawVideoIds[0]},
          ${"Video brief: Key takeaways"},
          ${"This is sample generated content sourced from a YouTube transcript. Replace with real AI output later."},
          ${"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
          ${"pending"},
          ${"VIDEO"}::"SourceType",
          now(),
          now()
        )
      `;
      contentArticleIds.push(id);
    }

    // Upload-based article
    if (rawSourceUploadIds[0]) {
      const id = makeCuid();
      await prisma.$executeRaw`
        INSERT INTO content_articles (
          id,
          users_id,
          category_id,
          raw_source_uploads_id,
          title,
          content,
          image_url,
          status,
          source_type,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${userId},
          ${categoryIdForExtras},
          ${rawSourceUploadIds[0]},
          ${"Upload analysis: Extracted document summary"},
          ${"This is sample generated content sourced from an upload/OCR flow. Replace with real AI output later."},
          ${"https://placehold.co/1200x675/png"},
          ${"pending"},
          ${"UPLOAD"}::"SourceType",
          now(),
          now()
        )
      `;
      contentArticleIds.push(id);
    }
  }

  const transformationIds = await seedTransformations(
    prisma,
    contentArticleIds,
    socialChannelIds
  );

  await seedSocialMediaPosts(prisma, transformationIds);

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
