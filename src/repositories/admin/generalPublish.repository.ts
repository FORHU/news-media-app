import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { categoriesRepository } from "@/repositories/categories.repository";

// Every active tenant except these 4 is a broadcast target — computed fresh on
// every call so a newly added tenant is automatically included.
const EXCLUDED_JEJU_DOMAINS = ["voicejeju.com", "jejutime.com", "jejuqq.com", "jejujapan.com"];

export type BroadcastOutcome = {
  tenantId: string;
  domain: string;
  success: boolean;
  contentArticleId?: string;
  error?: string;
};

export type CreateBroadcastParams = {
  title: string;
  content: string;
  category: string;
  imageUrl?: string | null;
  isHeadline?: boolean;
  publish?: boolean;
};

export type UpdateBroadcastParams = {
  title?: string;
  content?: string;
  category?: string;
  imageUrl?: string | null;
  isHeadline?: boolean;
  publish?: boolean;
};

export type FetchGeneralPublishesParams = {
  q: string;
  offset: number;
  limit: number;
  category?: string;
  status?: string;
};

export const generalPublishRepository = {
  async getTargetTenants() {
    return prisma.tenant.findMany({
      where: { isActive: true, domain: { notIn: EXCLUDED_JEJU_DOMAINS } },
      select: { id: true, domain: true },
    });
  },

  async fetchGeneralPublishes(params: FetchGeneralPublishesParams) {
    const { q, offset, limit, category, status } = params;
    const and: Prisma.GeneralPublishWhereInput[] = [];

    if (q.trim()) {
      and.push({
        OR: [
          { title: { contains: q.trim(), mode: "insensitive" } },
          { content: { contains: q.trim(), mode: "insensitive" } },
        ],
      });
    }

    if (category && category !== "All Types") {
      and.push({ category: { equals: category, mode: "insensitive" } });
    }

    if (status && status !== "All Status" && status !== "all") {
      const normalized = status.toLowerCase();
      if (normalized === "published") {
        and.push({ articles: { some: { status: "published" } } });
      } else if (normalized === "pending") {
        and.push({ articles: { none: { status: "published" } } });
      }
    }

    const where: Prisma.GeneralPublishWhereInput = and.length > 0 ? { AND: and } : {};

    const [rows, count] = await prisma.$transaction([
      prisma.generalPublish.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          articles: {
            select: {
              id: true,
              status: true,
              tenantId: true,
              tenant: { select: { domain: true, siteName: true } },
            },
          },
        },
      }),
      prisma.generalPublish.count({ where }),
    ]);

    return { data: rows, count };
  },

  async findBroadcast(id: string) {
    return prisma.generalPublish.findUnique({
      where: { id },
      include: {
        articles: {
          select: {
            id: true,
            status: true,
            tenantId: true,
            tenant: { select: { domain: true, siteName: true } },
          },
        },
      },
    });
  },

  /**
   * Sequential, not parallel — mirrors facebookPublishing.service.ts's fan-out
   * pattern: never aborts the whole batch on one tenant's failure, and (critically)
   * generates each slug and creates its row in the same iteration, since
   * generateUniqueArticleSlug only sees already-committed rows — batching slug
   * generation ahead of the inserts would make every candidate collide.
   */
  async createBroadcast(
    params: CreateBroadcastParams
  ): Promise<{ generalPublishId: string; outcomes: BroadcastOutcome[] }> {
    const { title, content, category, imageUrl, isHeadline, publish } = params;
    const targets = await this.getTargetTenants();

    const generalPublish = await prisma.generalPublish.create({
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        category,
        isHeadline: isHeadline ?? false,
      },
    });

    const outcomes: BroadcastOutcome[] = [];
    const publishDate = new Date();

    for (const tenant of targets) {
      try {
        const categoryRow = await categoriesRepository.createOrGetCategoryByName(category, tenant.id);

        // User is tenant-scoped (@@unique([tenantId, email])) — must resolve
        // per target tenant, not globally, or every row gets attributed to
        // whichever tenant a global query happens to return.
        const user =
          (await prisma.user.findFirst({ where: { tenantId: tenant.id, email: "admin@newsmedia.app" } })) ||
          (await prisma.user.findFirst({ where: { tenantId: tenant.id } }));

        if (!user) {
          outcomes.push({ tenantId: tenant.id, domain: tenant.domain, success: false, error: "no_system_user" });
          continue;
        }

        const slug = await generateUniqueArticleSlug(prisma, title, publishDate);

        const article = await prisma.contentArticle.create({
          data: {
            tenantId: tenant.id,
            usersId: user.id,
            categoryId: categoryRow.id,
            generalPublishId: generalPublish.id,
            title,
            slug,
            content,
            imageUrl: imageUrl || null,
            status: publish ? "published" : "pending",
            publishDate,
            sourceType: "MANUAL",
            isHeadline: isHeadline ?? false,
          },
          select: { id: true },
        });

        outcomes.push({ tenantId: tenant.id, domain: tenant.domain, success: true, contentArticleId: article.id });
      } catch (err) {
        outcomes.push({
          tenantId: tenant.id,
          domain: tenant.domain,
          success: false,
          error: err instanceof Error ? err.message : "unknown_error",
        });
      }
    }

    return { generalPublishId: generalPublish.id, outcomes };
  },

  async updateBroadcast(id: string, params: UpdateBroadcastParams): Promise<BroadcastOutcome[]> {
    const { title, content, category, imageUrl, isHeadline, publish } = params;

    const parentUpdate: Record<string, unknown> = {};
    if (title !== undefined) parentUpdate.title = title;
    if (content !== undefined) parentUpdate.content = content;
    if (category !== undefined) parentUpdate.category = category;
    if (imageUrl !== undefined) parentUpdate.imageUrl = imageUrl || null;
    if (isHeadline !== undefined) parentUpdate.isHeadline = isHeadline;

    if (Object.keys(parentUpdate).length > 0) {
      await prisma.generalPublish.update({ where: { id }, data: parentUpdate });
    }

    const children = await prisma.contentArticle.findMany({
      where: { generalPublishId: id },
      include: { tenant: { select: { domain: true } } },
    });

    const outcomes: BroadcastOutcome[] = [];

    for (const child of children) {
      try {
        const updateData: Record<string, unknown> = {};

        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
        if (isHeadline !== undefined) updateData.isHeadline = isHeadline;

        if (category !== undefined) {
          const categoryRow = await categoriesRepository.createOrGetCategoryByName(category, child.tenantId);
          updateData.categoryId = categoryRow.id;
        }

        if (title !== undefined && title !== child.title) {
          updateData.slug = await generateUniqueArticleSlug(prisma, title, child.publishDate ?? new Date());
        }

        if (publish !== undefined) {
          updateData.status = publish ? "published" : "pending";
          if (publish) updateData.publishDate = child.publishDate ?? new Date();
        }

        if (isHeadline === true) {
          await prisma.contentArticle.updateMany({
            where: { tenantId: child.tenantId, isHeadline: true, id: { not: child.id } },
            data: { isHeadline: false },
          });
        }

        const updated = await prisma.contentArticle.update({
          where: { id: child.id },
          data: updateData,
          select: { id: true },
        });

        outcomes.push({
          tenantId: child.tenantId,
          domain: child.tenant.domain,
          success: true,
          contentArticleId: updated.id,
        });
      } catch (err) {
        outcomes.push({
          tenantId: child.tenantId,
          domain: child.tenant.domain,
          success: false,
          error: err instanceof Error ? err.message : "unknown_error",
        });
      }
    }

    return outcomes;
  },

  /** Fetches image URLs before deleting so the caller can clean up S3 objects —
   *  the cascade removes the child rows, so they must be read out first. */
  async deleteBroadcast(id: string): Promise<{ imageUrls: string[] }> {
    const children = await prisma.contentArticle.findMany({
      where: { generalPublishId: id },
      select: { imageUrl: true, imageUrls: true },
    });

    const imageUrls = Array.from(
      new Set(children.flatMap((c) => [c.imageUrl, ...c.imageUrls]).filter((u): u is string => Boolean(u)))
    );

    await prisma.generalPublish.delete({ where: { id } });

    return { imageUrls };
  },
};
