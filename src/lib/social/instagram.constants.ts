export const INSTAGRAM_GRAPH_API_BASE_URL = "https://graph.facebook.com";

// Bump manually as Meta deprecates old versions — override at runtime via
// INSTAGRAM_GRAPH_API_VERSION if a newer version needs to be tested first.
export const DEFAULT_INSTAGRAM_GRAPH_API_VERSION = "v21.0";

export function buildInstagramMediaEndpoint(igUserId: string, version: string): string {
  return `${INSTAGRAM_GRAPH_API_BASE_URL}/${version}/${igUserId}/media`;
}

export function buildInstagramMediaPublishEndpoint(igUserId: string, version: string): string {
  return `${INSTAGRAM_GRAPH_API_BASE_URL}/${version}/${igUserId}/media_publish`;
}

export function buildInstagramMediaLookupEndpoint(mediaId: string, version: string): string {
  return `${INSTAGRAM_GRAPH_API_BASE_URL}/${version}/${mediaId}`;
}

export const INSTAGRAM_REQUEST_TIMEOUT_MS = 10_000;

// Instagram's official caption limit.
export const INSTAGRAM_CAPTION_MAX_LENGTH = 2200;

// A freshly created media container isn't publishable until Instagram
// finishes fetching/processing the image; poll status_code until FINISHED.
export const INSTAGRAM_CONTAINER_POLL_INTERVAL_MS = 1500;
export const INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS = 5;
