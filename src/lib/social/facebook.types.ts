/**
 * Shared shape any social provider (Facebook today; LinkedIn/X/Instagram
 * later) accepts and returns, so the publish loop in
 * facebookPublishing.service.ts stays provider-agnostic.
 */
export type SocialArticleInput = {
  id: string;
  title: string;
  summary?: string;
  url: string;
};

export type SocialPublishResult = {
  provider: "facebook";
  success: boolean;
  postId?: string;
  postUrl?: string;
  skipped?: boolean;
  error?: string;
};

export interface SocialPublisher {
  readonly provider: string;
  publishArticle(article: SocialArticleInput): Promise<SocialPublishResult>;
}

// ─── Meta Graph API shapes ─────────────────────────────────────────────────

export type FacebookGraphError = {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

export type FacebookGraphErrorResponse = {
  error?: FacebookGraphError;
};

export type FacebookFeedPostResponse = {
  id: string; // "{page-id}_{post-id}"
};
