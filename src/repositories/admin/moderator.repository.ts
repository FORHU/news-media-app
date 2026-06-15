import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";

const ARTICLE_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  imageUrl: true,
  publishDate: true,
  createdAt: true,
  tenantId: true,
  tenant: { select: { domain: true } },
  category: { select: { id: true, categoryName: true } },
  user: { select: { firstName: true, lastName: true } },
} as const;

export const moderatorRepository = {
  // ── Articles list ──────────────────────────────────────────────────────────

  async listPrimaryArticles(userId: string, skip: number, limit: number) {
    const baseWhere = { usersId: userId, sourceType: "MANUAL" as const };
    const primaryWhere = { ...baseWhere, tenant: { domain: "jejutime.com" } };

    const [primaryArticles, total] = await Promise.all([
      prisma.contentArticle.findMany({
        where: primaryWhere,
        select: ARTICLE_SELECT,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contentArticle.count({ where: primaryWhere }),
    ]);

    return { primaryArticles, total, baseWhere };
  },

  async findSiblings(
    baseWhere: { usersId: string; sourceType: "MANUAL" },
    primaryCreatedAt: Date,
    windowMs: number
  ) {
    const base = new Date(primaryCreatedAt).getTime();
    return prisma.contentArticle.findMany({
      where: {
        ...baseWhere,
        NOT: { tenant: { domain: "jejutime.com" } },
        createdAt: {
          gte: new Date(base - windowMs),
          lte: new Date(base + windowMs),
        },
      },
      select: ARTICLE_SELECT,
      orderBy: { createdAt: "asc" },
    });
  },

  // ── Single article ─────────────────────────────────────────────────────────

  findArticleByIdAndUser(id: string, userId: string) {
    return prisma.contentArticle.findFirst({
      where: { id, usersId: userId, sourceType: "MANUAL" },
      include: { category: { select: { id: true, categoryName: true } } },
    });
  },

  findArticleOwnership(id: string, userId: string) {
    return prisma.contentArticle.findFirst({
      where: { id, usersId: userId, sourceType: "MANUAL" },
    });
  },

  findCategoryInTenant(categoryId: string, tenantId: string) {
    return prisma.category.findFirst({ where: { id: categoryId, tenantId } });
  },

  async updateArticle(id: string, data: Record<string, unknown>, title?: string, currentPublishDate?: Date | null) {
    if (title) {
      data.slug = await generateUniqueArticleSlug(prisma, title, currentPublishDate ?? new Date());
    }
    return prisma.contentArticle.update({
      where: { id },
      data,
      include: { category: { select: { id: true, categoryName: true } } },
    });
  },

  async deleteArticle(id: string) {
    return prisma.$transaction(async (tx) => {
      const transformations = await tx.contentTransformation.findMany({
        where: { contentArticleId: id },
        select: { id: true },
      });
      if (transformations.length > 0) {
        await tx.socialMediaPost.deleteMany({
          where: { contentTransformationId: { in: transformations.map((t) => t.id) } },
        });
        await tx.contentTransformation.deleteMany({ where: { contentArticleId: id } });
      }
      await tx.contentArticle.delete({ where: { id } });
    });
  },

  findTenantById(id: string) {
    return prisma.tenant.findUnique({ where: { id }, select: { domain: true } });
  },

  // ── Publish / Unpublish ────────────────────────────────────────────────────

  publishMany(articleIds: string[]) {
    return prisma.contentArticle.updateMany({
      where: {
        id: { in: articleIds },
        sourceType: { in: ["MANUAL", "EXTERNAL"] },
        status: { in: ["pending", "unpublished"] },
      },
      data: { status: "published", publishDate: new Date() },
    });
  },

  findPublishedArticles(articleIds: string[]) {
    return prisma.contentArticle.findMany({
      where: { id: { in: articleIds } },
      select: {
        id: true,
        slug: true,
        title: true,
        sourceType: true,
        tenant: { select: { domain: true } },
        externalSubmission: {
          select: { id: true, externalArticleId: true, callbackUrl: true },
        },
      },
    });
  },

  updateExternalSubmissionCallback(id: string, status: string) {
    return prisma.externalArticleSubmission
      .update({
        where: { id },
        data: { callbackStatus: status, callbackSentAt: new Date() },
      })
      .catch(() => {});
  },

  unpublishMany(articleIds: string[]) {
    return prisma.contentArticle.updateMany({
      where: { id: { in: articleIds }, sourceType: "MANUAL" },
      data: { status: "unpublished" },
    });
  },

  // ── Categories ─────────────────────────────────────────────────────────────

  findCategoriesByTenant(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId, categoryName: { not: "N/A" } },
      select: { id: true, categoryName: true },
    });
  },
};
