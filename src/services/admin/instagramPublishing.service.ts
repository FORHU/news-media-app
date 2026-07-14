import { instagramPublishingRepository } from "@/repositories/admin/instagramPublishing.repository";
import { instagramPublisherService } from "@/lib/social/instagram.service";
import { INSTAGRAM_CAPTION_MAX_LENGTH } from "@/lib/social/instagram.constants";
import { cleanOgDescription } from "@/lib/metadata";

export type InstagramPublishOutcome = {
  articleId: string;
  success: boolean;
  postUrl?: string;
  error?: string;
};

function buildArticleUrl(domain: string, slug: string | null, id: string): string {
  return `https://${domain}/article/${slug ?? id}`;
}

export const instagramPublishingService = {
  async listPublishable(tenantId: string, params: { q: string; page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;
    const { data, count } = await instagramPublishingRepository.listPublishableArticles(tenantId, {
      q: params.q,
      offset,
      limit: params.limit,
    });

    return {
      articles: data,
      pagination: {
        total: count,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(count / params.limit),
      },
    };
  },

  async publishToInstagram(articleIds: string[], tenantId: string): Promise<InstagramPublishOutcome[]> {
    const channel = await instagramPublishingRepository.ensureInstagramChannel(tenantId);
    const results: InstagramPublishOutcome[] = [];

    // Sequential, not parallel — same rationale as Facebook: stays under
    // Meta's rate limits and keeps per-attempt log output readable.
    for (const articleId of articleIds) {
      const article = await instagramPublishingRepository.findArticleForPublish(articleId, tenantId);

      if (!article) {
        results.push({ articleId, success: false, error: "not_found_or_not_published" });
        continue;
      }

      const summary = cleanOgDescription(article.content, INSTAGRAM_CAPTION_MAX_LENGTH);
      const url = buildArticleUrl(article.tenant.domain, article.slug, article.id);

      const result = await instagramPublisherService.publishArticle({
        id: article.id,
        title: article.title,
        summary,
        url,
        imageUrl: article.imageUrl,
      });

      if (result.success && result.postUrl) {
        await instagramPublishingRepository.recordSuccess(article.id, channel.id, result.postUrl);
        results.push({ articleId, success: true, postUrl: result.postUrl });
      } else {
        await instagramPublishingRepository.recordFailure(article.id, channel.id);
        results.push({ articleId, success: false, error: result.error ?? "unknown_error" });
      }
    }

    return results;
  },
};
