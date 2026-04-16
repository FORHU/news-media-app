import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  articlesService,
  ArticlesServiceError,
} from "@/services/articles.service";
import { articleIdentifierParamSchema } from "@/lib/validation/articles";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parsed = articleIdentifierParamSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid path parameter", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const article = await articlesService.getArticleBySlugOrId(parsed.data.id);
    return NextResponse.json(article);
  } catch (error) {
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

