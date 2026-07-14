// ─── Meta Graph API shapes (Facebook Page feed) ────────────────────────────
// SocialArticleInput / SocialPublishResult / SocialPublisher moved to
// socialPublisher.types.ts once Instagram needed the same contract.

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
