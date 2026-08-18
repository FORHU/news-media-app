import { NextRequest, NextResponse } from "next/server";
import { generatedArticlesService } from "@/services/admin/generatedArticles.service";
import { generatedArticlesQuerySchema, createManualArticleSchema } from "@/lib/validation/generated";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { sseBroadcaster } from "@/lib/sse";

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

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const json = await req.json();
    const parsed = createManualArticleSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const created = await generatedArticlesService.createManualArticle(parsed.data, tenantId);
    sseBroadcaster.broadcast("articles:updated");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating manual article:", error);
    const message = error instanceof Error ? error.message : "Failed to create article";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
