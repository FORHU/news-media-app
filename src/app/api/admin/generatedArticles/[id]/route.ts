import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  youtubeUrl: z.string().url().optional().nullable().or(z.literal("")),
  publish: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.contentArticle.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const json = await req.json();
    const result = UpdateSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const { title, content, categoryId, imageUrl, youtubeUrl, publish } = result.data;

    // If category is changing, verify it exists
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }
    }

    // Regenerate slug only if title changes
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
    if (publish) {
      updateData.status = "published";
      updateData.publishDate = existing.publishDate ?? new Date();
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
    console.error("[PATCH Article] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
