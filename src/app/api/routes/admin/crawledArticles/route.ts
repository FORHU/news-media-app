import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  crawledArticlesService,
  CrawledArticlesServiceError,
} from "@/app/api/services/admin/crawledArticles.service";

const DATE_PRESETS = ["All Time", "Today", "Last 7 Days", "This Month"] as const;

const QuerySchema = z
  .object({
    source: z.string().optional().default("All Sources"),
    date: z.enum(DATE_PRESETS).optional().default("All Time"),
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    source: searchParams.get("source") ?? undefined,
    date: searchParams.get("date") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const result = await crawledArticlesService.getCrawledArticles(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching crawled articles:", error);

    if (error instanceof CrawledArticlesServiceError) {
      return NextResponse.json(
        { error: error.message, ...(error.payload as object) },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
