/**
 * Prisma seed. Run: npx prisma db seed
 * Requires: DATABASE_URL in .env. Run after: npx prisma migrate dev or npx prisma db push
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

const users = [
  {
    firstName: "Editor",
    lastName: "User",
    email: "editor@newsmedia.app",
    password: "change-me-in-production",
  },
];

const articles = [
  {
    title: "Global Markets Rally as Tech Stocks Surge to Record Highs",
    description:
      "Major technology companies led a widespread market rally today, with the Nasdaq reaching new all-time highs amid growing investor confidence in AI-driven innovation.",
    content:
      "Major technology companies led a widespread market rally today, with the Nasdaq reaching new all-time highs amid growing investor confidence in AI-driven innovation. Analysts pointed to strong earnings and upbeat guidance from sector leaders as key drivers.",
    categoryName: "Business & Finance",
    imageUrl: "https://placehold.co/800x500/1a1a1a/22c55e?text=Markets+%26+Charts",
    status: "article",
  },
  {
    title: "Breaking: Global Tech Summit Announces Major AI Partnerships",
    description:
      "Leading technology companies unveil collaborative efforts to advance responsible AI development.",
    content: "Full article content here...",
    categoryName: "Technology",
    imageUrl: "https://placehold.co/600x400/ff4500/ffffff?text=Tech+Summit",
    status: "article",
  },
  {
    title: "Climate Report Shows Progress on Renewable Energy Targets",
    description: "New data indicates significant gains in solar and wind capacity.",
    content: "Full article content here...",
    categoryName: "Environment",
    imageUrl: "https://placehold.co/600x400/22c55e/ffffff?text=Renewable",
    status: "article",
  },
  {
    title: "Healthcare Startup Secures $50M for Telemedicine Expansion",
    description: "The funding round will support nationwide rollout of virtual care platforms.",
    content: "Full article content here...",
    categoryName: "Business",
    imageUrl: "https://placehold.co/600x400/3b82f6/ffffff?text=Healthcare",
    status: "blog",
  },
  {
    title: "Local Community Rallies to Restore Historic Downtown District",
    description: "Volunteers and city officials join forces in a multi-year initiative.",
    content: "Full article content here...",
    categoryName: "Local",
    imageUrl: "https://placehold.co/600x400/f59e0b/ffffff?text=Downtown",
    status: "article",
  },
  {
    title: "Scientists Discover New Species in Deep Ocean Expedition",
    description: "A research vessel returns from a six-month mission with specimens.",
    content: "Full article content here...",
    categoryName: "Science",
    imageUrl: "https://placehold.co/600x400/06b6d4/ffffff?text=Ocean",
    status: "article",
  },
];

const crawledUrls = [
  { url: "https://example.com/news/tech-2024", status: "crawled" },
  { url: "https://example.com/news/climate-2024", status: "crawled" },
  { url: "https://example.com/news/health-2024", status: "crawled" },
  { url: "https://example.com/news/science-2024", status: "crawled" },
];

const sourceCites = [
  { url: "https://reuters.com/article/123" },
  { url: "https://apnews.com/article/456" },
  { url: "https://bbc.com/news/789" },
  { url: "https://nature.com/articles/abc" },
];

const socialChannels = [
  { socialMediaName: "Twitter" },
  { socialMediaName: "LinkedIn" },
  { socialMediaName: "Facebook" },
];

const seed = async () => {
  console.log("🌱 Starting seed...");

  if (!prisma) {
    throw new Error("DATABASE_URL is not set. Add it to .env");
  }

  const userIds: number[] = [];

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      userIds.push(existingUser.id);
      continue;
    }

    const newUser = await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
      },
    });
    userIds.push(newUser.id);
  }

  const categoryNames = [...new Set(articles.map((a) => a.categoryName))];
  const categoryMap: Record<string, number> = {};

  for (const name of categoryNames) {
    let cat = await prisma.category.findFirst({
      where: { categoryName: name },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: { categoryName: name },
      });
    }
    categoryMap[name] = cat.id;
  }

  const userId = userIds[0];
  if (userId == null) throw new Error("No user id for seeding articles");

  const contentArticleIds: number[] = [];
  for (const a of articles) {
    const categoryId = categoryMap[a.categoryName];
    if (categoryId == null) continue;
    const created = await prisma.contentArticle.create({
      data: {
        usersId: userId,
        categoryId,
        title: a.title,
        content: a.content,
        imageUrl: a.imageUrl,
        status: a.status,
      },
    });
    contentArticleIds.push(created.id);
  }

  const crawledUrlIds: number[] = [];
  for (const c of crawledUrls) {
    const existing = await prisma.crawledUrl.findUnique({
      where: { url: c.url },
    });
    if (existing) {
      crawledUrlIds.push(existing.id);
    } else {
      const created = await prisma.crawledUrl.create({
        data: { url: c.url, status: c.status },
      });
      crawledUrlIds.push(created.id);
    }
  }

  const sourceCiteIds: number[] = [];
  for (const s of sourceCites) {
    const existing = await prisma.sourceCite.findFirst({
      where: { url: s.url },
    });
    if (existing) {
      sourceCiteIds.push(existing.id);
    } else {
      const created = await prisma.sourceCite.create({
        data: { url: s.url },
      });
      sourceCiteIds.push(created.id);
    }
  }

  const socialChannelIds: number[] = [];
  for (const ch of socialChannels) {
    const existing = await prisma.socialChannel.findFirst({
      where: { socialMediaName: ch.socialMediaName },
    });
    if (existing) {
      socialChannelIds.push(existing.id);
    } else {
      const created = await prisma.socialChannel.create({
        data: { socialMediaName: ch.socialMediaName },
      });
      socialChannelIds.push(created.id);
    }
  }

  for (let i = 0; i < Math.min(4, contentArticleIds.length); i++) {
    const contentArticleId = contentArticleIds[i];
    const categoryId = categoryMap[articles[i].categoryName];
    if (categoryId == null) continue;
    await prisma.rawArticle.create({
      data: {
        contentArticleId,
        crawledUrlId: crawledUrlIds[i % crawledUrlIds.length],
        categoryId,
        sourceCitesId: sourceCiteIds[i % sourceCiteIds.length],
        title: `Raw: ${articles[i].title.slice(0, 50)}`,
        author: i % 2 === 0 ? "Staff Writer" : null,
        content: articles[i].content.slice(0, 200) + "...",
        imageUrl: articles[i].imageUrl,
      },
    });
  }

  const transformationIds: number[] = [];
  for (let i = 0; i < Math.min(3, contentArticleIds.length); i++) {
    for (let j = 0; j < Math.min(2, socialChannelIds.length); j++) {
      const created = await prisma.contentTransformation.create({
        data: {
          contentArticleId: contentArticleIds[i],
          socialChannelsId: socialChannelIds[j],
          tone: j === 0 ? "professional" : "casual",
          formatType: "post",
          transformedTitle: `[${socialChannels[j].socialMediaName}] ${articles[i].title.slice(0, 40)}`,
          transformedContent: articles[i].content.slice(0, 280) + "...",
          status: "published",
        },
      });
      transformationIds.push(created.id);
    }
  }

  const now = new Date();
  for (const transId of transformationIds) {
    await prisma.socialMediaPost.create({
      data: {
        contentTransformationId: transId,
        postUrl: `https://example.com/post/${transId}`,
        mediaUrl: ["https://placehold.co/400x200"],
        postedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("✅ Seeding finished successfully.");
};

seed()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });
