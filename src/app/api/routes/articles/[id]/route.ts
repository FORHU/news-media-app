import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  articlesService,
  ArticlesServiceError,
} from "@/app/api/services/articles.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await articlesService.getArticleById(id);
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

