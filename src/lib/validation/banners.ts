import { z } from "zod";

export const bannerPositions = [
  "HOME_TOP",
  "HOME_SIDEBAR",
  "ARTICLE_SIDEBAR",
  "GLOBAL_FOOTER",
] as const;

export type BannerPosition = (typeof bannerPositions)[number];

export const bannerSchema = z.object({
  name: z.string().trim().min(1, "Banner name is required"),
  imageUrl: z.string().trim().min(1, "Banner image is required"),
  linkUrl: z
    .string()
    .trim()
    .min(1, "Destination URL is required")
    .url("Please enter a valid URL (e.g., https://example.com)"),
  positions: z.array(z.enum(bannerPositions)).min(1, "Please select at least one position"),
  altText: z.string().trim().max(200, "Alt text must be under 200 characters").optional().nullable(),
  isActive: z.boolean().default(true),
});

export type BannerInput = z.infer<typeof bannerSchema>;

export const bannerUpdateSchema = bannerSchema.partial();
