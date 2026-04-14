import { z } from "zod";

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.");

/** API: crawl jobs list query params */
export const crawlJobsQuerySchema = z.object({
  page: z
    .preprocess((v) => (typeof v === "string" ? Number.parseInt(v, 10) : v), z.number().int().min(1))
    .optional()
    .default(1),
  limit: z
    .preprocess((v) => (typeof v === "string" ? Number.parseInt(v, 10) : v), z.number().int().min(1).max(100))
    .optional()
    .default(10),
});

/** API: stop crawl job body */
export const crawlJobsStopBodySchema = z.object({
  job_id: z.string().trim().min(1, "job_id is required"),
});

/** API: trigger crawl body (optional dates/max) */
export const crawlTriggerBodySchema = z
  .object({
    urls: z
      .array(z.string().trim().min(1, "URL cannot be empty"))
      .min(1, "At least one URL is required"),
    start_date: isoDate.optional(),
    end_date: isoDate.optional(),
    max_requests_per_crawl: z
      .number()
      .int()
      .min(1, "Max articles must be at least 1")
      .max(500, "Max articles must be 500 or less")
      .optional(),
  })
  .refine(
    (v) => {
      if (!v.start_date || !v.end_date) return true;
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      return start.getTime() <= end.getTime();
    },
    { message: "Start date must be before or equal to end date", path: ["end_date"] }
  );

const CRAWLED_ARTICLES_DATE_PRESETS = ["All Time", "Today", "Last 7 Days", "This Month"] as const;

/** API: crawled articles list query params */
export const crawledArticlesQuerySchema = z
  .object({
    source: z.string().optional().default("All Sources"),
    date: z.enum(CRAWLED_ARTICLES_DATE_PRESETS).optional().default("All Time"),
    from: z
      .string()
      .optional()
      .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), {
        message: "Invalid from date",
      }),
    to: z
      .string()
      .optional()
      .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), {
        message: "Invalid to date",
      }),
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
  })
  .superRefine((val, ctx) => {
    if ((val.from || val.to) && val.date !== "All Time") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either from/to range OR date preset, not both",
        path: ["date"],
      });
    }
  });

export const crawlConfigurationSchema = z
  .object({
    urls: z
      .array(z.string().trim().url("Please enter a valid URL."))
      .min(1, "Add at least one valid URL."),
    start_date: isoDate,
    end_date: isoDate,
    max_requests_per_crawl: z
      .number()
      .int("Max articles must be a whole number.")
      .min(1, "Max articles must be at least 1.")
      .max(500, "Max articles must be 500 or less."),
  })
  .refine(
    (v) => {
      const start = new Date(v.start_date);
      const end = new Date(v.end_date);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
      return start.getTime() <= end.getTime();
    },
    {
      message: "Start date must be before or equal to end date.",
      path: ["end_date"],
    }
  );


