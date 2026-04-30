import { NextRequest, NextResponse } from "next/server";
import { generatedArticlesService } from "@/services/admin/generatedArticles.service";
import { generatedArticlesQuerySchema } from "@/lib/validation/generated";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = generatedArticlesQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    status: searchParams.get("status") ?? undefined,
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
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({
        articles: [],
        pagination: {
          total: 0,
          page: parsed.data.page ? Number(parsed.data.page) : 1,
          limit: parsed.data.limit ? Number(parsed.data.limit) : 10,
          totalPages: 0,
        },
      });
    }

    const result = await generatedArticlesService.getGeneratedArticles(parsed.data, tenantId);
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
