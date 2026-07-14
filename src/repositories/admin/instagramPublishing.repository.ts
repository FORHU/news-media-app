import { prisma } from "@/lib/db";

// Reuses the same SocialChannel / ContentTransformation / SocialMediaPost
// tables as Facebook publishing, just under a different socialMediaName —
// see facebookPublishing.repository.ts for the original rationale.
const INSTAGRAM_CHANNEL_NAME = "instagram";

export type PublishableArticle = {
  id: string;
  title: string;
  slug: string | null;
  imageUrl: string | null;
  content: string;
  publishDate: Date | null;
  tenantDomain: string;
  instagramStatus: "not_posted" | "published" | "failed";
  instagramPostUrl: string | null;
};

export const instagramPublishingRepository = {
  async listPublishableArticles(
    tenantId: string,
    params: { q: string; offset: number; limit: number }
  ): Promise<{ data: PublishableArticle[]; count: number }> {
    const where = {
      tenantId,
      status: "published",
      ...(params.q.trim() ? { title: { contains: params.q.trim(), mode: "insensitive" as const } } : {}),
    };

    const [rows, count] = await prisma.$transaction([
      prisma.contentArticle.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        orderBy: { publishDate: { sort: "desc", nulls: "last" } },
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          content: true,
          publishDate: true,
          tenant: { select: { domain: true } },
        },
      }),
      prisma.contentArticle.count({ where }),
    ]);

    if (rows.length === 0) return { data: [], count };

    const transformations = await prisma.contentTransformation.findMany({
      where: {
        contentArticleId: { in: rows.map((r) => r.id) },
        socialChannel: { socialMediaName: INSTAGRAM_CHANNEL_NAME },
      },
      orderBy: { createdAt: "desc" },
      select: {
        contentArticleId: true,
        status: true,
        socialMediaPosts: { select: { postUrl: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    // Keep only the most recent attempt per article (already ordered desc above).
    const latestByArticle = new Map<string, (typeof transformations)[number]>();
    for (const t of transformations) {
      if (!latestByArticle.has(t.contentArticleId)) latestByArticle.set(t.contentArticleId, t);
    }

    const data: PublishableArticle[] = rows.map((row) => {
      const latest = latestByArticle.get(row.id);
      const instagramStatus: PublishableArticle["instagramStatus"] =
        latest?.status === "published" ? "published" : latest?.status === "failed" ? "failed" : "not_posted";

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        imageUrl: row.imageUrl,
        content: row.content,
        publishDate: row.publishDate,
        tenantDomain: row.tenant.domain,
        instagramStatus,
        instagramPostUrl: latest?.socialMediaPosts[0]?.postUrl ?? null,
      };
    });

    return { data, count };
  },

  async findArticleForPublish(id: string, tenantId: string) {
    return prisma.contentArticle.findFirst({
      where: { id, tenantId, status: "published" },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        imageUrl: true,
        tenant: { select: { domain: true } },
      },
    });
  },

  async ensureInstagramChannel(tenantId: string) {
    return prisma.socialChannel.upsert({
      where: { tenantId_socialMediaName: { tenantId, socialMediaName: INSTAGRAM_CHANNEL_NAME } },
      update: {},
      create: { tenantId, socialMediaName: INSTAGRAM_CHANNEL_NAME },
      select: { id: true },
    });
  },

  async recordSuccess(contentArticleId: string, socialChannelId: string, postUrl: string) {
    await prisma.contentTransformation.create({
      data: {
        contentArticleId,
        socialChannelsId: socialChannelId,
        status: "published",
        socialMediaPosts: {
          create: { postUrl, postedAt: new Date() },
        },
      },
    });
  },

  async recordFailure(contentArticleId: string, socialChannelId: string) {
    await prisma.contentTransformation.create({
      data: {
        contentArticleId,
        socialChannelsId: socialChannelId,
        status: "failed",
      },
    });
  },
};
