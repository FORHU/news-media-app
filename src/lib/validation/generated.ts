import { z } from "zod";

/** API: generated articles list query params */
export const generatedArticlesQuerySchema = z.object({
  category: z.string().optional().default("All Types"),
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

export type GeneratedArticlesQueryInput = z.infer<typeof generatedArticlesQuerySchema>;
