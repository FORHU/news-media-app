import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10) || 50,
      100
    );
    const search = searchParams.get("search");

    const articles: Article[] = await prisma!.contentArticle.findMany({
      take: limit,
      where: search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { category: { categoryName: { contains: search, mode: 'insensitive' } } }
        ]
      } : undefined,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });

    return NextResponse.json(articles);
  } catch (err) {
    console.error("Articles API error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
