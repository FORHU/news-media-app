import { z } from "zod";

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.");

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

export type CrawlConfigurationInput = z.infer<typeof crawlConfigurationSchema>;

