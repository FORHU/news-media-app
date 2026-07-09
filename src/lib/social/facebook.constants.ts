export const FACEBOOK_GRAPH_API_BASE_URL = "https://graph.facebook.com";

// Bump manually as Meta deprecates old versions — override at runtime via
// FACEBOOK_GRAPH_API_VERSION if a newer version needs to be tested first.
export const DEFAULT_FACEBOOK_GRAPH_API_VERSION = "v21.0";

export function buildFacebookFeedEndpoint(pageId: string, version: string): string {
  return `${FACEBOOK_GRAPH_API_BASE_URL}/${version}/${pageId}/feed`;
}

export const FACEBOOK_REQUEST_TIMEOUT_MS = 10_000;

// Graph API feed posts have no hard length limit, but a short teaser reads
// better than a full article body.
export const FACEBOOK_SUMMARY_MAX_LENGTH = 300;
