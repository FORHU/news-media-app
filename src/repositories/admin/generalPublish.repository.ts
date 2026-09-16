import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { categoriesRepository } from "@/repositories/categories.repository";
import { env } from "@/lib/env";
import { getAiSessionId, paraphraseArticle } from "@/lib/generateContentApi";

// Every active tenant except these 4 is a broadcast target — computed fresh on
// every call so a newly added tenant is automatically included.
const EXCLUDED_JEJU_DOMAINS = ["voicejeju.com", "jejutime.com", "jejuqq.com", "jejujapan.com"];

// Display names for Tenant.defaultLanguage codes, used to instruct the AI
// service when a broadcast needs translating for a non-English target tenant
// (e.g. techoggi.com/it, technikpost.de/de, techhoy.com/es). Tenants whose
// code isn't listed here are treated as English and never translated.
const LANGUAGE_NAMES: Record<string, string> = {
  it: "Italian",
  de: "German",
  es: "Spanish",
  fr: "French",
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese",
};

export type BroadcastOutcome = {
  tenantId: string;
  domain: string;
  success: boolean;
  contentArticleId?: string;
  slug?: string | null;
  error?: string;
  paraphrased?: boolean;
  /** Set when this tenant's copy was translated (its defaultLanguage isn't English). */
  translatedTo?: string;
};

export type CreateBroadcastParams = {
  title: string;
  content: string;
  category: string;
  /** First entry is the featured image (ContentArticle.imageUrl); the full
   *  array is stored on both GeneralPublish and every per-tenant row. */
  imageUrls?: string[];
  isHeadline?: boolean;
  publish?: boolean;
  /** Manual-entry broadcasts ask the AI service to rewrite title+content
   *  independently per tenant (same image everywhere) instead of publishing
   *  identical English-reading text to every site. AI-generate broadcasts
   *  leave this off — they already produce one AI-authored piece shared as-is.
   *  Either way, a target tenant whose defaultLanguage isn't English (e.g.
   *  techoggi.com/it, technikpost.de/de, techhoy.com/es) always gets its copy
   *  translated into that language, regardless of this flag. */
  paraphrasePerTenant?: boolean;
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
      select: { id: true, domain: true, defaultLanguage: true },
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
   * DB writes stay sequential — mirrors facebookPublishing.service.ts's fan-out
   * pattern: never aborts the whole batch on one tenant's failure, and (critically)
   * generates each slug and creates its row in the same iteration, since
   * generateUniqueArticleSlug only sees already-committed rows — batching slug
   * generation ahead of the inserts would make every candidate collide.
   *
   * The AI paraphrase/translate calls, however, run in PARALLEL (one per
   * tenant, phase 1 below) rather than sequentially — with up to 14 target
   * tenants and each call taking up to several seconds, doing them one at a
   * time could push total request time well past Cloudflare's ~100s edge
   * timeout, which both looks like a failure to the admin (524, even though
   * the broadcast actually completes server-side) and — far worse — was
   * observed to make literally every tenant's AI call fail/timeout, silently
   * falling back to identical, unformatted raw text on every site. Each
   * tenant gets its own session id rather than sharing one, since the AI
   * service's /chat endpoint is a conversational session and firing
   * concurrent requests at the same session id risks cross-request
   * interference.
   *
   * Shared by createBroadcast (all current targets, brand-new parent row) and
   * syncNewTenants (only the tenants missing from an existing broadcast).
   */
  async fanOutToTenants(
    generalPublish: { id: string; title: string; content: string; imageUrl: string | null; imageUrls: string[]; category: string; isHeadline: boolean },
    tenants: { id: string; domain: string; defaultLanguage: string | null }[],
    opts: { paraphrasePerTenant?: boolean; publish?: boolean }
  ): Promise<BroadcastOutcome[]> {
    const { title, content, category, imageUrl: primaryImageUrl, imageUrls, isHeadline } = generalPublish;
    const { paraphrasePerTenant, publish } = opts;

    // Non-English target tenants (techoggi.com/it, technikpost.de/de,
    // techhoy.com/es, ...) must always get the article in their own language,
    // regardless of the paraphrasePerTenant toggle — that toggle only governs
    // whether English-reading tenants get independently-reworded text.
    const needsTranslation = (lang: string | null) => !!lang && lang in LANGUAGE_NAMES;

    type Localized = { title: string; content: string; paraphrased: boolean; targetLanguage?: string };

    // Phase 1 — resolve every tenant's (possibly rewritten/translated) text
    // concurrently. Each tenant that doesn't need paraphrasing or translation
    // resolves instantly with the original text; failures fall back to the
    // original text too, exactly as before, just isolated per tenant instead
    // of shared through one session/loop.
    const localizedEntries = await Promise.all(
      tenants.map(async (tenant): Promise<[string, Localized]> => {
        const targetLanguage = needsTranslation(tenant.defaultLanguage)
          ? LANGUAGE_NAMES[tenant.defaultLanguage as string]
          : undefined;

        if (!paraphrasePerTenant && !targetLanguage) {
          return [tenant.id, { title, content, paraphrased: false, targetLanguage }];
        }

        try {
          const sessionId = await getAiSessionId(env.GENERATE_CONTENT_API ?? "");
          const rewritten = await paraphraseArticle({
            baseUrl: env.GENERATE_CONTENT_API ?? "",
            sessionId,
            title,
            content,
            targetLanguage,
          });
          return [tenant.id, { title: rewritten.title, content: rewritten.content, paraphrased: true, targetLanguage }];
        } catch (err) {
          console.error(
            `[generalPublish] ${targetLanguage ? `Translation to ${targetLanguage}` : "Paraphrase"} failed for ${tenant.domain}, using original text:`,
            err
          );
          return [tenant.id, { title, content, paraphrased: false, targetLanguage }];
        }
      })
    );
    const localizedByTenant = new Map(localizedEntries);

    const outcomes: BroadcastOutcome[] = [];
    const publishDate = new Date();

    for (const tenant of tenants) {
      try {
        const localized = localizedByTenant.get(tenant.id)!;
        const tenantTitle = localized.title;
        const tenantContent = localized.content;
        const paraphrased = localized.paraphrased;
        const targetLanguage = localized.targetLanguage;

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

        const slug = await generateUniqueArticleSlug(prisma, tenantTitle, publishDate);

        const article = await prisma.contentArticle.create({
          data: {
            tenantId: tenant.id,
            usersId: user.id,
            categoryId: categoryRow.id,
            generalPublishId: generalPublish.id,
            title: tenantTitle,
            slug,
            content: tenantContent,
            imageUrl: primaryImageUrl,
            imageUrls,
            status: publish ? "published" : "pending",
            publishDate,
            sourceType: "MANUAL",
            isHeadline: isHeadline ?? false,
          },
          select: { id: true },
        });

        outcomes.push({
          tenantId: tenant.id,
          domain: tenant.domain,
          success: true,
          contentArticleId: article.id,
          slug,
          ...(paraphrasePerTenant || targetLanguage ? { paraphrased } : {}),
          ...(targetLanguage ? { translatedTo: targetLanguage } : {}),
        });
      } catch (err) {
        outcomes.push({
          tenantId: tenant.id,
          domain: tenant.domain,
          success: false,
          error: err instanceof Error ? err.message : "unknown_error",
        });
      }
    }

    return outcomes;
  },

  async createBroadcast(
    params: CreateBroadcastParams
  ): Promise<{ generalPublishId: string; outcomes: BroadcastOutcome[] }> {
    const { title, content, category, isHeadline, publish, paraphrasePerTenant } = params;
    const imageUrls = params.imageUrls ?? [];
    const primaryImageUrl = imageUrls[0] ?? null;
    const targets = await this.getTargetTenants();

    const generalPublish = await prisma.generalPublish.create({
      data: {
        title,
        content,
        imageUrl: primaryImageUrl,
        imageUrls,
        category,
        isHeadline: isHeadline ?? false,
      },
    });

    const outcomes = await this.fanOutToTenants(generalPublish, targets, { paraphrasePerTenant, publish });

    return { generalPublishId: generalPublish.id, outcomes };
  },

  /**
   * Creates this broadcast's article for any active target tenant that was
   * added after it was originally published (the "Update New Tenants"
   * action) — without touching the tenants it already reached. New copies
   * inherit the broadcast's current overall publish state: live if it's
   * published anywhere already, pending otherwise.
   */
  async syncNewTenants(id: string): Promise<{ outcomes: BroadcastOutcome[]; addedCount: number; publish: boolean }> {
    const existing = await prisma.generalPublish.findUnique({
      where: { id },
      include: { articles: { select: { tenantId: true, status: true } } },
    });
    if (!existing) {
      throw new Error("Broadcast not found");
    }

    const targets = await this.getTargetTenants();
    const existingTenantIds = new Set(existing.articles.map((a) => a.tenantId));
    const missingTenants = targets.filter((t) => !existingTenantIds.has(t.id));

    const publish = existing.articles.some((a) => a.status === "published");

    if (missingTenants.length === 0) {
      return { outcomes: [], addedCount: 0, publish };
    }

    const outcomes = await this.fanOutToTenants(existing, missingTenants, {
      paraphrasePerTenant: true,
      publish,
    });

    return { outcomes, addedCount: missingTenants.length, publish };
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
          select: { id: true, slug: true },
        });

        outcomes.push({
          tenantId: child.tenantId,
          domain: child.tenant.domain,
          success: true,
          contentArticleId: updated.id,
          slug: updated.slug,
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
