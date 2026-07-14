/**
 * Shared shape any social provider (Facebook, Instagram, and future
 * LinkedIn/X) accepts and returns, so each platform's publish loop
 * (facebookPublishing.service.ts, instagramPublishing.service.ts, ...)
 * stays provider-agnostic.
 */
export type SocialArticleInput = {
  id: string;
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string | null;
};

export type SocialPublishResult = {
  provider: "facebook" | "instagram";
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
