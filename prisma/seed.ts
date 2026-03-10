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

  const transformationIds = await seedTransformations(
    prisma,
    contentArticleIds,
    socialChannelIds
  );

  await seedSocialMediaPosts(prisma, transformationIds);

  console.log("✅ Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
