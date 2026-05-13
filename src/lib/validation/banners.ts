import { z } from "zod";

export const bannerPositions = [
  "HOME_TOP",
  "HOME_SIDEBAR",
  "ARTICLE_SIDEBAR",
  "GLOBAL_FOOTER",
  "SIDEBAR_L_TOP",
  "SIDEBAR_L_MID",
  "SIDEBAR_R_MID",
  "SIDEBAR_R_BTM",
  "CONTENT_MID",
] as const;

export type BannerPosition = (typeof bannerPositions)[number];

const baseBannerSchema = z.object({
  name: z.string().trim().min(1, "Banner name is required"),
  bannerType: z.enum(["IMAGE", "VIDEO"]).default("IMAGE"),
  imageUrl: z.string().trim().nullable().optional(),
  youtubeUrl: z.string().trim().nullable().optional(),
  linkUrl: z
    .string()
    .trim()
    .min(1, "Destination URL is required")
    .url("Please enter a valid URL (e.g., https://example.com)"),
  positions: z.array(z.enum(bannerPositions)).min(1, "Please select at least one position"),
  altText: z.string().trim().max(200, "Alt text must be under 200 characters").optional().nullable(),
  isActive: z.boolean().default(true),
});

export const bannerSchema = baseBannerSchema.superRefine((data, ctx) => {
  if (data.bannerType === "IMAGE" && (!data.imageUrl || data.imageUrl.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Image is required for Image banners",
      path: ["imageUrl"],
    });
  }
  if (data.bannerType === "VIDEO" && (!data.youtubeUrl || data.youtubeUrl.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "YouTube URL is required for Video banners",
      path: ["youtubeUrl"],
    });
  }
});

export type BannerInput = z.infer<typeof bannerSchema>;

export const bannerUpdateSchema = baseBannerSchema.partial();
