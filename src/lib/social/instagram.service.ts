import { getInstagramConfig } from "./instagram.config";
import {
  buildInstagramMediaEndpoint,
  buildInstagramMediaPublishEndpoint,
  buildInstagramMediaLookupEndpoint,
  INSTAGRAM_REQUEST_TIMEOUT_MS,
  INSTAGRAM_CONTAINER_POLL_INTERVAL_MS,
  INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS,
} from "./instagram.constants";
import type {
  InstagramMediaContainerResponse,
  InstagramMediaPublishResponse,
  InstagramContainerStatusResponse,
  InstagramMediaLookupResponse,
  InstagramGraphError,
  InstagramGraphErrorResponse,
} from "./instagram.types";
import type { SocialArticleInput, SocialPublishResult, SocialPublisher } from "./socialPublisher.types";

function buildCaption(article: SocialArticleInput): string {
  const summary = article.summary?.trim();
  const body = summary ? `${article.title}\n\n${summary}` : article.title;
  // Instagram doesn't render links as clickable in captions (and /media has
  // no `link` param like Facebook's /feed does), so the URL is just plain text.
  return `${body}\n\n${article.url}`;
}

// Maps Meta Graph API error codes to a stable, loggable reason.
// Reference: https://developers.facebook.com/docs/graph-api/guides/error-handling
function classifyGraphError(error: InstagramGraphError | undefined): string {
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
    case 9007:
      return "media_not_ready";
    default:
      return `graph_error_${error.code ?? "unknown"}`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const instagramPublisherService: SocialPublisher = {
  provider: "instagram",

  async publishArticle(article: SocialArticleInput): Promise<SocialPublishResult> {
    const config = getInstagramConfig();

    if (!config) {
      console.warn(
        `[instagram] Skipped publish for article ${article.id} — INSTAGRAM_BUSINESS_ACCOUNT_ID/INSTAGRAM_ACCESS_TOKEN not configured.`
      );
      return { provider: "instagram", success: false, skipped: true, error: "not_configured" };
    }

    // Instagram feed posts require media — unlike Facebook there's no
    // text/link-only fallback.
    if (!article.imageUrl) {
      console.warn(`[instagram] Skipped publish for article ${article.id} — Instagram posts require an image.`);
      return { provider: "instagram", success: false, error: "missing_image" };
    }

    const caption = buildCaption(article);

    try {
      // Step 1: create a media container. Instagram fetches article.imageUrl
      // itself, so it must be a public HTTPS URL (true here since these are
      // already-published articles' CDN/S3 images).
      const createRes = await fetch(buildInstagramMediaEndpoint(config.igUserId, config.graphApiVersion), {
        method: "POST",
        body: new URLSearchParams({
          image_url: article.imageUrl,
          caption,
          access_token: config.accessToken,
        }),
        signal: AbortSignal.timeout(INSTAGRAM_REQUEST_TIMEOUT_MS),
      });

      const createJson = (await createRes.json().catch(() => null)) as
        | (InstagramMediaContainerResponse & InstagramGraphErrorResponse)
        | null;

      if (!createRes.ok || !createJson || createJson.error) {
        const reason = classifyGraphError(createJson?.error);
        console.error(
          `[instagram] Container creation failed for article ${article.id} | status: ${createRes.status} | reason: ${reason} | message: ${createJson?.error?.message ?? "unknown"}`
        );
        return { provider: "instagram", success: false, error: reason };
      }

      const creationId = createJson.id;

      // Step 2: poll until Instagram finishes processing the image.
      let ready = false;
      for (let attempt = 0; attempt < INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS; attempt++) {
        const statusRes = await fetch(
          `${buildInstagramMediaLookupEndpoint(creationId, config.graphApiVersion)}?fields=status_code&access_token=${encodeURIComponent(config.accessToken)}`,
          { signal: AbortSignal.timeout(INSTAGRAM_REQUEST_TIMEOUT_MS) }
        );
        const statusJson = (await statusRes.json().catch(() => null)) as InstagramContainerStatusResponse | null;

        if (statusJson?.status_code === "FINISHED") {
          ready = true;
          break;
        }
        if (statusJson?.status_code === "ERROR" || statusJson?.status_code === "EXPIRED") {
          console.error(
            `[instagram] Container ${creationId} for article ${article.id} failed processing: ${statusJson.status_code}`
          );
          return { provider: "instagram", success: false, error: "container_processing_failed" };
        }

        await sleep(INSTAGRAM_CONTAINER_POLL_INTERVAL_MS);
      }

      if (!ready) {
        console.error(`[instagram] Container ${creationId} for article ${article.id} never finished processing in time.`);
        return { provider: "instagram", success: false, error: "container_timeout" };
      }

      console.log(`[instagram] Publishing article ${article.id} ("${article.title}") via container ${creationId}...`);

      // Step 3: publish the now-ready container.
      const publishRes = await fetch(buildInstagramMediaPublishEndpoint(config.igUserId, config.graphApiVersion), {
        method: "POST",
        body: new URLSearchParams({
          creation_id: creationId,
          access_token: config.accessToken,
        }),
        signal: AbortSignal.timeout(INSTAGRAM_REQUEST_TIMEOUT_MS),
      });

      const publishJson = (await publishRes.json().catch(() => null)) as
        | (InstagramMediaPublishResponse & InstagramGraphErrorResponse)
        | null;

      if (!publishRes.ok || !publishJson || publishJson.error) {
        const reason = classifyGraphError(publishJson?.error);
        console.error(
          `[instagram] Publish failed for article ${article.id} | status: ${publishRes.status} | reason: ${reason} | message: ${publishJson?.error?.message ?? "unknown"}`
        );
        return { provider: "instagram", success: false, error: reason };
      }

      const postId = publishJson.id;

      // The publish response only returns a numeric media id, not the
      // instagram.com/p/{shortcode} URL — look up the real permalink.
      const lookupRes = await fetch(
        `${buildInstagramMediaLookupEndpoint(postId, config.graphApiVersion)}?fields=permalink&access_token=${encodeURIComponent(config.accessToken)}`,
        { signal: AbortSignal.timeout(INSTAGRAM_REQUEST_TIMEOUT_MS) }
      );
      const lookupJson = (await lookupRes.json().catch(() => null)) as InstagramMediaLookupResponse | null;
      const postUrl = lookupJson?.permalink ?? "https://www.instagram.com/";

      console.log(`[instagram] Published article ${article.id} → post ${postId}`);
      return { provider: "instagram", success: true, postId, postUrl };
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      const message = err instanceof Error ? err.message : "unknown error";
      console.error(
        `[instagram] Publish threw for article ${article.id} | ${isTimeout ? "timeout" : "network error"}: ${message}`
      );
      return { provider: "instagram", success: false, error: isTimeout ? "timeout" : "network_error" };
    }
  },
};
