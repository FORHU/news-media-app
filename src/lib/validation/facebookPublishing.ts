import { z } from "zod";

/** API: Facebook-publishable articles list query params */
export const facebookArticlesQuerySchema = z.object({
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

/** API: bulk "publish to Facebook" request body */
export const facebookPublishRequestSchema = z.object({
  articleIds: z.array(z.string().trim().min(1)).min(1).max(20),
});

export type FacebookPublishRequest = z.infer<typeof facebookPublishRequestSchema>;
