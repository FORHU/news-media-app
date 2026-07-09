import { DEFAULT_FACEBOOK_GRAPH_API_VERSION } from "./facebook.constants";

export type FacebookConfig = {
  pageId: string;
  pageAccessToken: string;
  // Unused by the /feed POST itself (that only needs the page token) — kept
  // for a future long-lived-token-refresh flow.
  appId?: string;
  appSecret?: string;
  graphApiVersion: string;
};

/**
 * Reads Facebook env vars lazily (call this at publish-time, not at module
 * load) so a deployment without Facebook configured never crashes a build
 * or an unrelated request — same pattern as getS3Client() in lib/s3.ts.
 */
export function getFacebookConfig(): FacebookConfig | null {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !pageAccessToken) return null;

  return {
    pageId,
    pageAccessToken,
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    graphApiVersion: process.env.FACEBOOK_GRAPH_API_VERSION || DEFAULT_FACEBOOK_GRAPH_API_VERSION,
  };
}
