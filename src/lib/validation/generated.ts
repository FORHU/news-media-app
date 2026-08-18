import { z } from "zod";

/** API: generated articles list query params */
export const generatedArticlesQuerySchema = z.object({
  category: z.string().optional().default("All Types"),
  status: z.string().optional().default("All Status"),
  q: z.string().optional().default(""),
  page: z
    .preprocess(
      (v) => (typeof v === "string" ? Number.parseInt(v, 10) : v),
      z.number().int().min(1)
    )
    .optional()
    .default(1),
  limit: z
    .preprocess(
      (v) => (typeof v === "string" ? Number.parseInt(v, 10) : v),
      z.number().int().min(1).max(100)
    )
    .optional()
    .default(10),
});

/** API: manually create a generated article (no AI) */
export const createManualArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Article content is required"),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isHeadline: z.boolean().optional(),
  publish: z.boolean().optional(),
});

export type CreateManualArticleInput = z.infer<typeof createManualArticleSchema>;

