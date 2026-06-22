import { z } from "zod";

export const externalArticleSubmissionSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  content: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1).max(200),
  imageUrls: z.array(z.string().url()).optional(),
  language: z.string().trim().max(50).optional(),
  externalArticleId: z.string().trim().min(1).max(500),
  callbackUrl: z.string().url().optional(),
});

export type ExternalArticleSubmissionInput = z.infer<typeof externalArticleSubmissionSchema>;

const articleEntrySchema = z.object({
  language: z.string().trim().min(1).max(50),
  title: z.string().trim().min(1).max(1000),
  content: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1).max(200),
  imageUrls: z.array(z.string().url()).optional(),
});

export const multiArticleSubmissionSchema = z.object({
  externalArticleId: z.string().trim().min(1).max(500),
  articles: z.array(articleEntrySchema).min(1).max(10),
  callbackUrl: z.string().url().optional(),
});

export type MultiArticleSubmissionInput = z.infer<typeof multiArticleSubmissionSchema>;
