import { moderatorRepository } from "@/repositories/admin/moderator.repository";
import { sendWebhookCallback } from "@/lib/webhook";
import { revalidatePath } from "next/cache";
import { uploadToS3 } from "@/lib/s3";
import { randomUUID } from "crypto";
import { CATEGORY_TRANSLATIONS, TENANT_CATEGORIES } from "@/config/categories";

const TRANSLATION_TO_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_TRANSLATIONS).map(([translated, english]) => [translated, english])
);
const JEJUTIME_ENGLISH_NAMES = TENANT_CATEGORIES["jejutime.com"];

const TWO_MINUTES = 2 * 60 * 1000;
const DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

export class ModeratorServiceError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ModeratorServiceError";
  }
}

async function resolveImageUrl(imageUrl: unknown, hasImageUrl: boolean): Promise<string | null | undefined> {
  if (!hasImageUrl) return undefined;
  if (!imageUrl) return null;
  if (typeof imageUrl === "string" && imageUrl.startsWith("data:image/")) {
    const match = imageUrl.match(DATA_URL_REGEX);
    if (!match) throw new ModeratorServiceError("Invalid base64 image.", 400);
    const mime = match[1];
    const buf = Buffer.from(match[2], "base64");
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("gif") ? "gif" : "jpg";
    return uploadToS3(buf, `moderator-edit-${Date.now()}-${randomUUID()}.${ext}`, mime);
  }
  return typeof imageUrl === "string" ? imageUrl : undefined;
}

async function triggerRevalidation(tenantId: string, articleId: string, slug?: string | null) {
  try {
    const tenant = await moderatorRepository.findTenantById(tenantId);
    if (tenant?.domain) {
      revalidatePath(`/${tenant.domain}`, "page");
      revalidatePath(`/${tenant.domain}/article/${articleId}`, "page");
      if (slug) revalidatePath(`/${tenant.domain}/article/${slug}`, "page");
    }
  } catch { /* non-fatal */ }
}

export const moderatorService = {
  async listArticles(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { primaryArticles, total, baseWhere } = await moderatorRepository.listPrimaryArticles(userId, skip, limit);

    const groups = await Promise.all(
      primaryArticles.map(async (primary) => {
        const siblings = await moderatorRepository.findSiblings(baseWhere, primary.createdAt, TWO_MINUTES);
        return { primary, siblings };
      })
    );

    return { groups, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getArticle(id: string, userId: string) {
    const article = await moderatorRepository.findArticleByIdAndUser(id, userId);
    if (!article) throw new ModeratorServiceError("Article not found", 404);
    return article;
  },

  async updateArticle(
    id: string,
    userId: string,
    body: { title?: string; content?: string; categoryId?: string; imageUrl?: unknown; status?: string }
  ) {
    const existing = await moderatorRepository.findArticleOwnership(id, userId);
    if (!existing) throw new ModeratorServiceError("Article not found", 404);

    if (body.categoryId) {
      const cat = await moderatorRepository.findCategoryInTenant(body.categoryId, existing.tenantId);
      if (!cat) throw new ModeratorServiceError("Category not found", 400);
    }

    const hasImageUrl = Object.prototype.hasOwnProperty.call(body, "imageUrl");
    const resolvedImage = await resolveImageUrl(body.imageUrl, hasImageUrl);

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (resolvedImage !== undefined) updateData.imageUrl = resolvedImage;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "published" && !existing.publishDate) {
        updateData.publishDate = new Date();
      }
    }

    const updated = await moderatorRepository.updateArticle(
      id,
      updateData,
      body.title !== undefined && body.title !== existing.title ? body.title : undefined,
      existing.publishDate
    );

    await triggerRevalidation(existing.tenantId, id, updated.slug);
    return updated;
  },

  async deleteArticle(id: string, userId: string) {
    const existing = await moderatorRepository.findArticleOwnership(id, userId);
    if (!existing) throw new ModeratorServiceError("Article not found", 404);

    await moderatorRepository.deleteArticle(id);
    await triggerRevalidation(existing.tenantId, id, existing.slug);
  },

  async publishArticles(articleIds: string[], moderatorEmail: string) {
    const { count } = await moderatorRepository.publishMany(articleIds);
    console.log(
      `[moderator/publish] ✅ Published ${count}/${articleIds.length} articles | moderator: ${moderatorEmail} | ids: [${articleIds.join(", ")}]`
    );

    const articles = await moderatorRepository.findPublishedArticles(articleIds);
    for (const article of articles) {
      const domain = article.tenant?.domain;
      if (!domain) continue;
      try {
        revalidatePath(`/${domain}`, "page");
        revalidatePath(`/${domain}/article/${article.id}`, "page");
        if (article.slug) revalidatePath(`/${domain}/article/${article.slug}`, "page");
        console.log(`[moderator/publish] 🔄 Revalidated | domain: ${domain} | id: ${article.id}`);
      } catch { /* non-fatal */ }

      const sub = article.externalSubmission;
      if (article.sourceType === "EXTERNAL" && sub?.callbackUrl) {
        const articleUrl = article.slug ? `https://${domain}/article/${article.slug}` : undefined;
        const result = await sendWebhookCallback(sub.callbackUrl, {
          externalArticleId: sub.externalArticleId,
          status: "approved",
          articleUrl,
        });
        await moderatorRepository.updateExternalSubmissionCallback(sub.id, result.success ? "sent" : "failed");
      }
    }

    return count;
  },

  async unpublishArticles(articleIds: string[], moderatorEmail: string) {
    const { count } = await moderatorRepository.unpublishMany(articleIds);
    console.log(
      `[moderator/unpublish] ⬇️ Unpublished ${count}/${articleIds.length} articles | moderator: ${moderatorEmail} | ids: [${articleIds.join(", ")}]`
    );
    return count;
  },

  async getCategories(tenantId: string) {
    const dbCategories = await moderatorRepository.findCategoriesByTenant(tenantId);

    return dbCategories
      .map((c) => {
        const englishName =
          TRANSLATION_TO_ENGLISH[c.categoryName] ??
          (JEJUTIME_ENGLISH_NAMES.find((n) => n.toLowerCase() === c.categoryName.toLowerCase()) || null);
        return englishName ? { id: c.id, name: englishName } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const ai = JEJUTIME_ENGLISH_NAMES.indexOf(a!.name);
        const bi = JEJUTIME_ENGLISH_NAMES.indexOf(b!.name);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
  },
};
