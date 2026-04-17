import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s&-]+$/,
      "Category name can only contain letters, numbers, spaces, hyphens and ampersands"
    )
    .transform((val) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
