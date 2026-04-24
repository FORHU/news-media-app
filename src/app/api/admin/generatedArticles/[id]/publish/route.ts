import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { generatedArticlesService } from "@/services/admin/generatedArticles.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ─── Schema for the pre-publish editor PATCH ──────────────────────────────────
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

const UpdateSchema = z.object({
  title: z.string().trim().min(1, "Headline is required").optional(),
  content: z.string().trim().min(1, "Article content is required").optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  imageUrl: z.string().url("Invalid image URL format").optional().nullable().or(z.literal("")),
  youtubeUrl: z.string()
    .url("Invalid URL format")
    .regex(YOUTUBE_REGEX, "Must be a valid YouTube URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  publish: z.boolean().optional(),
});

// ─── POST – legacy publish (no body required) ──────────────────────────────────
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

// ─── PATCH – update fields and/or publish ─────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  if (!id) {
    return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
  }

  try {
    const existing = await prisma.contentArticle.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const json = await req.json();
    console.log("[PATCH /publish] Received body:", JSON.stringify(json, null, 2));
    const result = UpdateSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.issues.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { title, content, categoryId, imageUrl, youtubeUrl, publish } = result.data;

    // Verify category exists if changing
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
    }

    // Regenerate slug only if title actually changed
    let newSlug = existing.slug;
    if (title && title !== existing.title) {
      const publishDate = existing.publishDate ?? new Date();
      newSlug = await generateUniqueArticleSlug(prisma, title, publishDate);
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl || null;
    if (newSlug !== existing.slug) updateData.slug = newSlug;
    if (publish !== undefined) {
      updateData.status = publish ? "published" : "pending";
      if (publish) {
        updateData.publishDate = existing.publishDate ?? new Date();
      }
    }

    const updated = await prisma.contentArticle.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        user: { select: { firstName: true, lastName: true } },
        rawArticle: { include: { category: true, crawledUrl: true } },
        rawVideo: true,
        rawSourceUpload: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH publish/route] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
