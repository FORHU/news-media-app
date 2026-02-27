import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { articlesService } from "@/app/api/services/articles.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const search = searchParams.get("search");

    const articles = await articlesService.getArticles({ limit, search });
    return NextResponse.json(articles);
  } catch (error) {
    console.error("Articles API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

