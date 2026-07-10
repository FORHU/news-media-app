import { facebookPublishingRepository } from "@/repositories/admin/facebookPublishing.repository";
import { facebookPublisherService } from "@/lib/social/facebook.service";
import { FACEBOOK_SUMMARY_MAX_LENGTH } from "@/lib/social/facebook.constants";
import { cleanOgDescription } from "@/lib/metadata";

export type FacebookPublishOutcome = {
  articleId: string;
  success: boolean;
  postUrl?: string;
  error?: string;
};

function buildArticleUrl(domain: string, slug: string | null, id: string): string {
  return `https://${domain}/article/${slug ?? id}`;
}

export const facebookPublishingService = {
  async listPublishable(tenantId: string, params: { q: string; page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;
    const { data, count } = await facebookPublishingRepository.listPublishableArticles(tenantId, {
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

  async publishToFacebook(articleIds: string[], tenantId: string): Promise<FacebookPublishOutcome[]> {
    const channel = await facebookPublishingRepository.ensureFacebookChannel(tenantId);
    const results: FacebookPublishOutcome[] = [];

    // Sequential, not parallel — keeps us well under Meta's rate limits when an
    // admin selects many rows at once, and keeps log output readable per attempt.
    for (const articleId of articleIds) {
      const article = await facebookPublishingRepository.findArticleForPublish(articleId, tenantId);

      if (!article) {
        results.push({ articleId, success: false, error: "not_found_or_not_published" });
        continue;
      }

      const summary = cleanOgDescription(article.content, FACEBOOK_SUMMARY_MAX_LENGTH);
      const url = buildArticleUrl(article.tenant.domain, article.slug, article.id);

      const result = await facebookPublisherService.publishArticle({
        id: article.id,
        title: article.title,
        summary,
        url,
      });

      if (result.success && result.postUrl) {
        await facebookPublishingRepository.recordSuccess(article.id, channel.id, result.postUrl);
        results.push({ articleId, success: true, postUrl: result.postUrl });
      } else {
        await facebookPublishingRepository.recordFailure(article.id, channel.id);
        results.push({ articleId, success: false, error: result.error ?? "unknown_error" });
      }
    }

    return results;
  },
};
