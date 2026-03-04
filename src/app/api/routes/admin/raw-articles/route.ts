import { NextResponse } from "next/server";
import { rawArticlesService } from "@/app/api/services/rawArticles.service";

export async function GET() {
  try {
    const rawArticles = await rawArticlesService.getRawArticles();
    return NextResponse.json(rawArticles);
  } catch (error) {
    console.error("Raw articles API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

