import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Article } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const row = await prisma!.contentArticle.findUnique({
      where: { id: numId },
      include: { category: true },
    });

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const article: Article = row;

    return NextResponse.json(article);
  } catch (err) {
    console.error("Article API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
