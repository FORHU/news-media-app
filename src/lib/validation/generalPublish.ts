import { z } from "zod";

/** API: general publishes list query params */
export const generalPublishesQuerySchema = z.object({
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

/** API: manually create a general (broadcast) article — no AI */
export const createManualGeneralPublishSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Article content is required"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isHeadline: z.boolean().optional(),
  publish: z.boolean().optional(),
});

export type CreateManualGeneralPublishInput = z.infer<typeof createManualGeneralPublishSchema>;

/** API: AI-generate a general (broadcast) article */
export const createGeneralPublishFromUploadSchema = z.object({
  category: z.string().min(1, "Category is required"),
  topic: z.string().optional().default(""),
  prompt: z.string().optional().default(""),
  language: z.string().optional().default(""),
  extractedText: z.string().optional().default(""),
  s3ImageUrl: z.string().optional().or(z.literal("")).default(""),
  materialImages: z.array(z.string()).optional().default([]),
});

/** API: edit an existing broadcast (cascades to every per-tenant copy) */
export const updateGeneralPublishSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  isHeadline: z.boolean().optional(),
  publish: z.boolean().optional(),
});

export type UpdateGeneralPublishInput = z.infer<typeof updateGeneralPublishSchema>;
