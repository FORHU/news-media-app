import { NextRequest, NextResponse } from "next/server";
import { generatedArticlesService } from "@/services/admin/generatedArticles.service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  if (!id) {
    return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
  }

  try {
    await generatedArticlesService.publishArticle(id);
    return NextResponse.json({ success: true, message: "Article published successfully" });
  } catch (error) {
    console.error("Error publishing article:", error);
    return NextResponse.json(
      { error: "Failed to publish article" },
      { status: 500 }
    );
  }
}
