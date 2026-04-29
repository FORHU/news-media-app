import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { articlesService } from "@/services/articles.service";
import { articlesQuerySchema } from "@/lib/validation/articles";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const parsed = articlesQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) return NextResponse.json([]);

    const articles = await articlesService.getArticles(parsed.data, tenantId);
    return NextResponse.json(articles);
  } catch (error) {
    console.error("Articles API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

