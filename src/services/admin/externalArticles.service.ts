import { externalArticlesRepository } from "@/repositories/admin/externalArticles.repository";
import { sendWebhookCallback } from "@/lib/webhook";
import { revalidatePath } from "next/cache";
import {
  JEJU_SITES,
  detectLanguage,
  toEnglishCategory,
  categoryForDomain,
  translate,
} from "@/lib/crossPost";

const JEJU_DOMAINS = ["jejutime.com", "voicejeju.com", "jejuqq.com", "jejujapan.com"];

export class ExternalArticlesServiceError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ExternalArticlesServiceError";
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const externalArticlesService = {
  list(status: string, page: number, limit: number) {
    return externalArticlesRepository.list(status, page, limit);
  },

  async publish(articleIds: string[]) {
    const primaryId = articleIds[0];
    const primary = await externalArticlesRepository.findByIdForPublish(primaryId);

    if (!primary || primary.sourceType !== "EXTERNAL" || primary.status !== "draft") {
      throw new ExternalArticlesServiceError("Article not found or not in draft state.", 404);
    }

    const batchDate = primary.publishDate ?? new Date();
    const translations = await externalArticlesRepository.findTranslationsInBatch(primaryId, batchDate, ["draft"]);
    const allIds = [primaryId, ...translations.map((t) => t.id)];

    await externalArticlesRepository.publishMany(allIds, new Date());

    const sourceDomain = primary.tenant?.domain ?? "";
    for (const domain of JEJU_DOMAINS) {
      try { revalidatePath(`/${domain}`, "page"); } catch { /* non-fatal */ }
    }
    if (primary.slug && sourceDomain) {
      try { revalidatePath(`/${sourceDomain}/article/${primary.slug}`, "page"); } catch { /* non-fatal */ }
    }

    const sub = primary.externalSubmission;
    if (sub?.callbackUrl) {
      const articleUrl =
        primary.slug && sourceDomain
          ? `https://${sourceDomain}/article/${primary.slug}`
          : undefined;
      const result = await sendWebhookCallback(sub.callbackUrl, {
        externalArticleId: sub.externalArticleId,
        status: "approved",
        articleUrl,
      });
      await externalArticlesRepository.updateCallbackStatus(sub.id, result.success ? "sent" : "failed");
    }

    return allIds.length;
  },

  async delete(articleId: string) {
    const article = await externalArticlesRepository.findByIdForDelete(articleId);
    if (!article || article.sourceType !== "EXTERNAL") {
      throw new ExternalArticlesServiceError("Article not found.", 404);
    }

    if (article.externalSubmission && article.publishDate) {
      const batch = await externalArticlesRepository.findBatchForDelete(articleId, article.publishDate);
      if (batch.length > 0) {
        await externalArticlesRepository.deleteMany(batch.map((b) => b.id));
      }
      await externalArticlesRepository.deleteOne(articleId);
      return 1 + batch.length;
    }

    await externalArticlesRepository.deleteOne(articleId);
    return 1;
  },

  async reject(articleIds: string[], reason?: string) {
    const { count } = await externalArticlesRepository.rejectMany(articleIds);
    const articles = await externalArticlesRepository.findForRejectCallbacks(articleIds);

    for (const article of articles) {
      const sub = article.externalSubmission;
      if (!sub?.callbackUrl) continue;
      const result = await sendWebhookCallback(sub.callbackUrl, {
        externalArticleId: sub.externalArticleId,
        status: "rejected",
        reason,
      });
      await externalArticlesRepository.updateCallbackStatus(sub.id, result.success ? "sent" : "failed");
    }

    return count;
  },

  async unpublish(articleIds: string[]) {
    const primaryId = articleIds[0];
    const primary = await externalArticlesRepository.findByIdForUnpublish(primaryId);

    if (!primary || primary.sourceType !== "EXTERNAL" || primary.status !== "published") {
      throw new ExternalArticlesServiceError("Article not found or not unpublishable.", 404);
    }

    if (primary.externalSubmission && primary.publishDate) {
      return externalArticlesRepository.unpublishBatch(primaryId, primary.publishDate);
    }

    await externalArticlesRepository.unpublishOne(primaryId);
    return 1;
  },

  async update(articleId: string, data: { title: string; content: string; imageUrl?: string }) {
    const article = await externalArticlesRepository.findByIdForUpdate(articleId);
    if (!article || article.sourceType !== "EXTERNAL") {
      throw new ExternalArticlesServiceError("Article not found.", 404);
    }

    await externalArticlesRepository.updateArticle(articleId, {
      title: data.title.trim(),
      content: data.content.trim(),
    });

    if (typeof data.imageUrl === "string" && article.publishDate) {
      await externalArticlesRepository.updateBatchImage(article.publishDate, data.imageUrl.trim() || null);
    }
  },

  async approve(articleIds: string[], baseUrl: string) {
    const sourceArticles = await externalArticlesRepository.findPendingByIds(articleIds);
    if (sourceArticles.length === 0) {
      throw new ExternalArticlesServiceError("No pending external articles found.", 404);
    }

    const draftDate = new Date();
    let totalDrafted = 0;

    for (const source of sourceArticles) {
      const sourceDomain = source.tenant?.domain ?? "";
      const sourceLanguage = detectLanguage(source.content);
      const sourceCategoryName = source.category?.categoryName ?? "";
      const englishCategory = toEnglishCategory(sourceCategoryName, sourceDomain);

      console.log(
        `[external/approve] ▶ "${source.title}" | src: ${sourceDomain} (${sourceLanguage}) | category: "${sourceCategoryName}" → EN: "${englishCategory}"`
      );

      for (const site of JEJU_SITES) {
        const isSourceSite = site.domain === sourceDomain;

        const tenant = isSourceSite
          ? { id: source.tenant!.id }
          : await externalArticlesRepository.findTenantByDomain(site.domain);

        if (!tenant) {
          console.warn(`[external/approve] ⚠ Tenant not found: ${site.domain}, skipping.`);
          continue;
        }

        let targetCategoryId: string | null = null;
        if (englishCategory) {
          const localName = categoryForDomain(englishCategory, site.domain);
          if (localName) {
            const cat = await externalArticlesRepository.findCategoryByName(tenant.id, localName);
            if (cat) {
              targetCategoryId = cat.id;
            } else {
              console.warn(`[external/approve] ⚠ Category "${localName}" not in DB for ${site.domain}, skipping.`);
            }
          } else {
            console.warn(`[external/approve] ⚠ No category mapping for "${englishCategory}" → ${site.domain}, skipping.`);
          }
        }

        if (!targetCategoryId && !isSourceSite) continue;

        await sleep(1500);

        const translated = await translate(baseUrl, source.title, source.content, site.language, sourceLanguage);

        if (isSourceSite) {
          await externalArticlesRepository.draftOriginal(source.id, translated.title, translated.content, draftDate);
          totalDrafted++;
          console.log(`[external/approve] 📝 Drafted original | domain: ${site.domain} | lang: ${site.language}`);
        } else {
          const botUser = await externalArticlesRepository.upsertBotUser(tenant.id);
          await externalArticlesRepository.createDraft({
            tenantId: tenant.id,
            usersId: botUser.id,
            categoryId: targetCategoryId!,
            title: translated.title,
            content: translated.content,
            imageUrl: source.imageUrl ?? null,
            imageUrls: source.imageUrls ?? [],
            draftDate,
          });
          console.log(
            `[external/approve] 📝 Drafted | domain: ${site.domain} | lang: ${site.language} | title: "${translated.title}"`
          );
        }
      }

      for (const site of JEJU_SITES) {
        try { revalidatePath(`/${site.domain}`, "page"); } catch { /* non-fatal */ }
      }
    }

    return totalDrafted;
  },
};
