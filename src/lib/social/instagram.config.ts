import { DEFAULT_INSTAGRAM_GRAPH_API_VERSION } from "./instagram.constants";

export type InstagramConfig = {
  igUserId: string;
  accessToken: string;
  graphApiVersion: string;
};

/**
 * Reads Instagram env vars lazily (call this at publish-time, not at module
 * load) so a deployment without Instagram configured never crashes a build
 * or an unrelated request — same pattern as getFacebookConfig().
 */
export function getInstagramConfig(): InstagramConfig | null {
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!igUserId || !accessToken) return null;

  return {
    igUserId,
    accessToken,
    graphApiVersion: process.env.INSTAGRAM_GRAPH_API_VERSION || DEFAULT_INSTAGRAM_GRAPH_API_VERSION,
  };
}
