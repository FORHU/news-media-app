import { NextResponse } from "next/server";
import { rawArticlesRepository } from "@/app/api/repositories/raw-articles.repository";

export async function GET() {
  try {
    const articles = await rawArticlesRepository.findMany();
    return NextResponse.json(articles);
  } catch (error) {
    console.error("Raw articles API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

