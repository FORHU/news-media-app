import { z } from "zod";

export const externalArticleSubmissionSchema = z.object({
  title: z.string().trim().min(1).max(1000),
  content: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1).max(200),
  imageUrl: z.string().url().optional(),
  language: z.string().trim().max(50).optional(),
  externalArticleId: z.string().trim().min(1).max(500),
  callbackUrl: z.string().url().optional(),
});

export type ExternalArticleSubmissionInput = z.infer<typeof externalArticleSubmissionSchema>;
