import { z } from "zod";

/** API: articles list query params */
export const articlesQuerySchema = z.object({
  limit: z
    .preprocess(
      (v) => (typeof v === "string" ? Number.parseInt(v, 10) : v),
      z.number().int().min(1).max(100)
    )
    .optional()
    .default(50),
  search: z
    .preprocess(
      (v) => (v == null || v === "" ? undefined : v),
      z.string().trim().max(500).optional()
    ),
  category: z
    .preprocess(
      (v) => (v == null || v === "" ? undefined : v),
      z.string().trim().max(100).optional()
    ),
});

export type ArticlesQueryInput = z.infer<typeof articlesQuerySchema>;

/** API: article by id path param */
export const articleIdParamSchema = z.object({
  id: z.string().trim().min(1, "Article id is required").max(100),
});

export type ArticleIdParamInput = z.infer<typeof articleIdParamSchema>;
