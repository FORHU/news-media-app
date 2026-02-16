import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";

function contentToDescription(content: string, maxLength = 160): string {
  const plain = content.replace(/<[^>]*>/g, "").trim();
  return plain.length <= maxLength ? plain : plain.slice(0, maxLength) + "…";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const row = await prisma.contentArticle.findUnique({
      where: { id: numId },
      include: { category: true },
    });

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const article: Article & { content: string } = {
      id: row.id,
      title: row.title,
      description: contentToDescription(row.content),
      image: row.imageUrl ?? `https://placehold.co/600x400/e5e7eb/9ca3af?text=${encodeURIComponent(row.title.slice(0, 20))}`,
      category: row.category.categoryName,
      type: row.status ?? "article",
      createdAt: row.createdAt.toISOString(),
      content: row.content,
    };

    return NextResponse.json(article);
  } catch (err) {
    console.error("Article API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
