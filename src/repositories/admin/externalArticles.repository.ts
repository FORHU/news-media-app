import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";

const BATCH_WINDOW_MS = 10_000;

function batchWindow(date: Date) {
  return {
    gte: new Date(date.getTime() - BATCH_WINDOW_MS),
    lte: new Date(date.getTime() + BATCH_WINDOW_MS),
  };
}

export const externalArticlesRepository = {
  async list(status: string, page: number, limit: number) {
    const where = {
      sourceType: "EXTERNAL" as const,
      ...(status !== "all" ? { status } : {}),
    };
    const skip = (page - 1) * limit;
    const [articles, total] = await Promise.all([
      prisma.contentArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          imageUrl: true,
          content: true,
          createdAt: true,
          publishDate: true,
          tenant: { select: { domain: true, siteName: true } },
          category: { select: { id: true, categoryName: true } },
          externalSubmission: {
            select: {
              id: true,
              sourcePlatform: true,
              externalArticleId: true,
              submittedLanguage: true,
              callbackUrl: true,
              callbackStatus: true,
              callbackSentAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contentArticle.count({ where }),
    ]);
    return { articles, total, page, totalPages: Math.ceil(total / limit) };
  },

  findByIdForPublish(id: string) {
    return prisma.contentArticle.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        publishDate: true,
        sourceType: true,
        status: true,
        tenant: { select: { domain: true } },
        externalSubmission: { select: { id: true, externalArticleId: true, callbackUrl: true } },
      },
    });
  },

  findTranslationsInBatch(primaryId: string, publishDate: Date, statuses: string[]) {
    return prisma.contentArticle.findMany({
      where: {
        id: { not: primaryId },
        sourceType: "EXTERNAL",
        status: { in: statuses },
        publishDate: batchWindow(publishDate),
        externalSubmission: { is: null },
      },
      select: { id: true },
    });
  },

  publishMany(ids: string[], publishDate: Date) {
    return prisma.contentArticle.updateMany({
      where: { id: { in: ids } },
      data: { status: "published", publishDate },
    });
  },

  updateCallbackStatus(submissionId: string, status: string) {
    return prisma.externalArticleSubmission
      .update({
        where: { id: submissionId },
        data: { callbackStatus: status, callbackSentAt: new Date() },
      })
      .catch(() => {});
  },

  findByIdForDelete(id: string) {
    return prisma.contentArticle.findUnique({
      where: { id },
      select: {
        id: true,
        publishDate: true,
        sourceType: true,
        externalSubmission: { select: { id: true } },
      },
    });
  },

  findBatchForDelete(primaryId: string, publishDate: Date) {
    return prisma.contentArticle.findMany({
      where: {
        id: { not: primaryId },
        sourceType: "EXTERNAL",
        publishDate: batchWindow(publishDate),
        externalSubmission: { is: null },
      },
      select: { id: true },
    });
  },

  deleteMany(ids: string[]) {
    return prisma.contentArticle.deleteMany({ where: { id: { in: ids } } });
  },

  deleteOne(id: string) {
    return prisma.contentArticle.delete({ where: { id } });
  },

  rejectMany(ids: string[]) {
    return prisma.contentArticle.updateMany({
      where: { id: { in: ids }, sourceType: "EXTERNAL", status: "pending" },
      data: { status: "rejected" },
    });
  },

  findForRejectCallbacks(ids: string[]) {
    return prisma.contentArticle.findMany({
      where: { id: { in: ids }, sourceType: "EXTERNAL" },
      select: {
        id: true,
        externalSubmission: { select: { id: true, externalArticleId: true, callbackUrl: true } },
      },
    });
  },

  findByIdForUnpublish(id: string) {
    return prisma.contentArticle.findUnique({
      where: { id },
      select: {
        id: true,
        publishDate: true,
        sourceType: true,
        status: true,
        externalSubmission: { select: { id: true } },
      },
    });
  },

  async unpublishBatch(primaryId: string, publishDate: Date) {
    const draftDate = new Date();
    const translations = await prisma.contentArticle.findMany({
      where: {
        id: { not: primaryId },
        sourceType: "EXTERNAL",
        status: "published",
        publishDate: batchWindow(publishDate),
        externalSubmission: { is: null },
      },
      select: { id: true },
    });
    const allIds = [primaryId, ...translations.map((t) => t.id)];
    await prisma.contentArticle.updateMany({
      where: { id: { in: allIds } },
      data: { status: "draft", publishDate: draftDate },
    });
    return allIds.length;
  },

  unpublishOne(id: string) {
    return prisma.contentArticle.update({
      where: { id },
      data: { status: "draft", publishDate: new Date() },
    });
  },

  findByIdForUpdate(id: string) {
    return prisma.contentArticle.findUnique({
      where: { id },
      select: { id: true, sourceType: true, publishDate: true },
    });
  },

  updateArticle(id: string, data: { title: string; content: string }) {
    return prisma.contentArticle.update({ where: { id }, data });
  },

  updateBatchImage(publishDate: Date, imageUrl: string | null) {
    return prisma.contentArticle.updateMany({
      where: { sourceType: "EXTERNAL", publishDate: batchWindow(publishDate) },
      data: { imageUrl },
    });
  },

  findPendingByIds(ids: string[]) {
    return prisma.contentArticle.findMany({
      where: { id: { in: ids }, sourceType: "EXTERNAL", status: "pending" },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        imageUrls: true,
        slug: true,
        tenant: { select: { id: true, domain: true } },
        category: { select: { categoryName: true } },
        externalSubmission: { select: { id: true, externalArticleId: true, callbackUrl: true } },
      },
    });
  },

  findTenantByDomain(domain: string) {
    return prisma.tenant.findUnique({ where: { domain }, select: { id: true } });
  },

  findCategoryByName(tenantId: string, name: string) {
    return prisma.category.findFirst({
      where: { tenantId, categoryName: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
  },

  upsertBotUser(tenantId: string) {
    const email = `external-bot@${tenantId}.internal`;
    return prisma.user.upsert({
      where: { tenantId_email: { tenantId, email } },
      update: {},
      create: { tenantId, email, firstName: "External", lastName: "Bot", role: "external_bot", password: "" },
      select: { id: true },
    });
  },

  draftOriginal(id: string, title: string, content: string, draftDate: Date) {
    return prisma.contentArticle.update({
      where: { id },
      data: { title, content, status: "draft", publishDate: draftDate },
    });
  },

  async createDraft(data: {
    tenantId: string;
    usersId: string;
    categoryId: string;
    title: string;
    content: string;
    imageUrl: string | null;
    imageUrls: string[];
    draftDate: Date;
  }) {
    const slug = await generateUniqueArticleSlug(prisma, data.title, data.draftDate);
    return prisma.contentArticle.create({
      data: {
        tenantId: data.tenantId,
        usersId: data.usersId,
        categoryId: data.categoryId,
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl,
        imageUrls: data.imageUrls,
        slug,
        sourceType: "EXTERNAL",
        status: "draft",
        publishDate: data.draftDate,
      },
    });
  },
};
