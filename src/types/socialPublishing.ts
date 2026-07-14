export type PublishStatus = "not_posted" | "published" | "failed";

export type PublishableArticle = {
  id: string;
  title: string;
  slug: string | null;
  imageUrl: string | null;
  content: string;
  publishDate: string | null;
  tenantDomain: string;
  status: PublishStatus;
  postUrl: string | null;
};

export type PublishOutcome = {
  articleId: string;
  success: boolean;
  postUrl?: string;
  error?: string;
};
