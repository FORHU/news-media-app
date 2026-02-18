import type { PrismaClient } from "../../src/generated/prisma/client";

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

export { articles };

export async function seedArticles(
  prisma: PrismaClient,
  userId: number,
  categoryMap: Record<string, number>
): Promise<number[]> {
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
  return contentArticleIds;
}
