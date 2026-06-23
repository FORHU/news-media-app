import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  articlesService,
  ArticlesServiceError,
} from "@/services/articles.service";
import { articleIdentifierParamSchema } from "@/lib/validation/articles";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId ?? "");

  const parsed = articleIdentifierParamSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid path parameter", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const tenantId = await resolveTenantIdFromRequest(_request);
    if (!tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const article = await articlesService.getArticleBySlugOrId(parsed.data.id, tenantId);
    return NextResponse.json(article);
  } catch (error: unknown) {
    if (error instanceof ArticlesServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Article API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

