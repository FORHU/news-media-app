import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";

function contentToDescription(content: string, maxLength = 160): string {
  const plain = content.replace(/<[^>]*>/g, "").trim();
  return plain.length <= maxLength ? plain : plain.slice(0, maxLength) + "…";
}

export async function GET(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "50", 10) || 50,
      100
    );

    const rows = await prisma.contentArticle.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });

    const articles: Article[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: contentToDescription(row.content),
      image: row.imageUrl ?? `https://placehold.co/600x400/e5e7eb/9ca3af?text=${encodeURIComponent(row.title.slice(0, 20))}`,
      category: row.category.categoryName,
      type: row.status ?? "article",
      createdAt: row.createdAt.toISOString(),
    }));

    return NextResponse.json(articles);
  } catch (err) {
    console.error("Articles API error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
