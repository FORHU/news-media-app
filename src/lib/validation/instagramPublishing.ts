import { z } from "zod";

/** API: Instagram-publishable articles list query params */
export const instagramArticlesQuerySchema = z.object({
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

/** API: bulk "publish to Instagram" request body */
export const instagramPublishRequestSchema = z.object({
  articleIds: z.array(z.string().trim().min(1)).min(1).max(20),
});

export type InstagramPublishRequest = z.infer<typeof instagramPublishRequestSchema>;
