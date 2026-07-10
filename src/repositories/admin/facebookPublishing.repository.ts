import { prisma } from "@/lib/db";

// Reuses the existing (previously unused) SocialChannel / ContentTransformation /
// SocialMediaPost tables as the attempt log for social publishing — no unmodified
// fields (tone, formatType, transformedTitle, transformedContent) are touched
// since Facebook posts repost the original content as-is.
const FACEBOOK_CHANNEL_NAME = "facebook";

export type PublishableArticle = {
  id: string;
  title: string;
  slug: string | null;
  imageUrl: string | null;
  content: string;
  publishDate: Date | null;
  tenantDomain: string;
  facebookStatus: "not_posted" | "published" | "failed";
  facebookPostUrl: string | null;
};

export const facebookPublishingRepository = {
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
        socialChannel: { socialMediaName: FACEBOOK_CHANNEL_NAME },
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
      const facebookStatus: PublishableArticle["facebookStatus"] =
        latest?.status === "published" ? "published" : latest?.status === "failed" ? "failed" : "not_posted";

      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        imageUrl: row.imageUrl,
        content: row.content,
        publishDate: row.publishDate,
        tenantDomain: row.tenant.domain,
        facebookStatus,
        facebookPostUrl: latest?.socialMediaPosts[0]?.postUrl ?? null,
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
        tenant: { select: { domain: true } },
      },
    });
  },

  async ensureFacebookChannel(tenantId: string) {
    return prisma.socialChannel.upsert({
      where: { tenantId_socialMediaName: { tenantId, socialMediaName: FACEBOOK_CHANNEL_NAME } },
      update: {},
      create: { tenantId, socialMediaName: FACEBOOK_CHANNEL_NAME },
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
