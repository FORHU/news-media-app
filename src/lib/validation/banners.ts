import { z } from "zod";

export const bannerPositions = [
  "HOME_TOP",
  "HOME_SIDEBAR",
  "ARTICLE_SIDEBAR",
  "GLOBAL_FOOTER",
] as const;

export type BannerPosition = (typeof bannerPositions)[number];

export const bannerSchema = z.object({
  imageUrl: z.string().trim().min(1, "Banner image is required"),
  linkUrl: z
    .string()
    .trim()
    .min(1, "Destination URL is required")
    .url("Please enter a valid URL (e.g., https://example.com)"),
  position: z.enum(bannerPositions, {
    error: "Please select a valid placement position",
  }),
  altText: z.string().trim().max(200, "Alt text must be under 200 characters").optional().nullable(),
  isActive: z.boolean().default(true),
});

export type BannerInput = z.infer<typeof bannerSchema>;

export const bannerUpdateSchema = bannerSchema.partial();
