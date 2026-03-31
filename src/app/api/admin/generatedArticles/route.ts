import { NextRequest, NextResponse } from "next/server";
import { generatedArticlesService } from "@/services/admin/generatedArticles.service";
import { generatedArticlesQuerySchema } from "@/lib/validation/generated";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = generatedArticlesQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
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
    const result = await generatedArticlesService.getGeneratedArticles(parsed.data);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("Error fetching generated articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch generated articles" },
      { status: 500 }
    );
  }
}
