import { getFacebookConfig } from "./facebook.config";
import { buildFacebookFeedEndpoint, FACEBOOK_REQUEST_TIMEOUT_MS } from "./facebook.constants";
import type { FacebookFeedPostResponse, FacebookGraphError, FacebookGraphErrorResponse } from "./facebook.types";
import type { SocialArticleInput, SocialPublishResult, SocialPublisher } from "./socialPublisher.types";

function buildMessage(article: SocialArticleInput): string {
  const summary = article.summary?.trim();
  return summary ? `${article.title}\n\n${summary}` : article.title;
}

// Maps Meta Graph API error codes to a stable, loggable reason.
// Reference: https://developers.facebook.com/docs/graph-api/guides/error-handling
function classifyGraphError(error: FacebookGraphError | undefined): string {
  if (!error) return "unknown_graph_error";
  switch (error.code) {
    case 190:
      return "token_expired_or_invalid";
    case 200:
    case 10:
      return "permission_denied";
    case 4:
    case 32:
    case 613:
      return "rate_limited";
    default:
      return `graph_error_${error.code ?? "unknown"}`;
  }
}

export const facebookPublisherService: SocialPublisher = {
  provider: "facebook",

  async publishArticle(article: SocialArticleInput): Promise<SocialPublishResult> {
    const config = getFacebookConfig();

    if (!config) {
      console.warn(
        `[facebook] Skipped publish for article ${article.id} — FACEBOOK_PAGE_ID/FACEBOOK_PAGE_ACCESS_TOKEN not configured.`
      );
      return { provider: "facebook", success: false, skipped: true, error: "not_configured" };
    }

    const endpoint = buildFacebookFeedEndpoint(config.pageId, config.graphApiVersion);
    const message = buildMessage(article);

    console.log(`[facebook] Publishing article ${article.id} ("${article.title}") to Page ${config.pageId}...`);

    try {
      const body = new URLSearchParams({
        message,
        link: article.url,
        access_token: config.pageAccessToken,
      });

      const res = await fetch(endpoint, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(FACEBOOK_REQUEST_TIMEOUT_MS),
      });

      const json = (await res.json().catch(() => null)) as
        | (FacebookFeedPostResponse & FacebookGraphErrorResponse)
        | null;

      if (!res.ok || !json || json.error) {
        const reason = classifyGraphError(json?.error);
        console.error(
          `[facebook] Publish failed for article ${article.id} | status: ${res.status} | reason: ${reason} | message: ${json?.error?.message ?? "unknown"}`
        );
        return { provider: "facebook", success: false, error: reason };
      }

      const postId = json.id;
      const postUrl = `https://www.facebook.com/${postId}`;
      console.log(`[facebook] Published article ${article.id} → post ${postId}`);
      return { provider: "facebook", success: true, postId, postUrl };
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      const message = err instanceof Error ? err.message : "unknown error";
      console.error(
        `[facebook] Publish threw for article ${article.id} | ${isTimeout ? "timeout" : "network error"}: ${message}`
      );
      return { provider: "facebook", success: false, error: isTimeout ? "timeout" : "network_error" };
    }
  },
};
