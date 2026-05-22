import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { uploadToS3 } from "@/lib/s3";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

function detectExt(mime: string) {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

async function uploadBase64(dataUrl: string): Promise<string> {
  const match = dataUrl.match(DATA_URL_REGEX);
  if (!match) throw new Error("Invalid base64 image.");
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  const ext = detectExt(mime);
  return uploadToS3(buf, `moderator-edit-${Date.now()}-${randomUUID()}.${ext}`, mime);
}

async function findArticle(id: string, tenantId: string) {
  return prisma.contentArticle.findFirst({
    where: { id, tenantId, sourceType: "MANUAL", user: { role: "moderator" } },
  });
}

async function triggerRevalidation(tenantId: string, articleId: string, slug?: string | null) {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { domain: true } });
    if (tenant?.domain) {
      revalidatePath(`/${tenant.domain}`, "page");
      revalidatePath(`/${tenant.domain}/article/${articleId}`, "page");
      if (slug) revalidatePath(`/${tenant.domain}/article/${slug}`, "page");
    }
  } catch { /* non-fatal */ }
}

// ── GET — fetch single article ────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const article = await prisma.contentArticle.findFirst({
      where: { id, tenantId, sourceType: "MANUAL", user: { role: "moderator" } },
      include: { category: { select: { id: true, categoryName: true } } },
    });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    return NextResponse.json(article);
  } catch (error: any) {
    console.error("[moderator/articles GET single] Error:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

// ── PATCH — update title / content / category / image / status ────────────────
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await findArticle(id, tenantId);
    if (!existing) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    const body = await req.json();
    const { title, content, categoryId, imageUrl, status } = body;

    if (categoryId) {
      const cat = await prisma.category.findFirst({ where: { id: categoryId, tenantId } });
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    // Resolve image: undefined = untouched, null = removed, base64 = new upload, string = existing URL
    let resolvedImageUrl: string | null | undefined = undefined;
    if (Object.prototype.hasOwnProperty.call(body, "imageUrl")) {
      if (!imageUrl) {
        resolvedImageUrl = null;
      } else if (imageUrl.startsWith("data:image/")) {
        resolvedImageUrl = await uploadBase64(imageUrl);
      } else {
        resolvedImageUrl = imageUrl;
      }
    }

    let newSlug = existing.slug;
    if (title && title !== existing.title) {
      newSlug = await generateUniqueArticleSlug(prisma, title, existing.publishDate ?? new Date());
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (resolvedImageUrl !== undefined) updateData.imageUrl = resolvedImageUrl;
    if (newSlug !== existing.slug) updateData.slug = newSlug;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "published" && !existing.publishDate) {
        updateData.publishDate = new Date();
      }
    }

    const updated = await prisma.contentArticle.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, categoryName: true } } },
    });

    await triggerRevalidation(tenantId, id, updated.slug);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[moderator/articles PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

// ── DELETE — remove article and its dependent records ────────────────────────
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await findArticle(id, tenantId);
    if (!existing) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      const transformations = await tx.contentTransformation.findMany({
        where: { contentArticleId: id },
        select: { id: true },
      });
      if (transformations.length > 0) {
        await tx.socialMediaPost.deleteMany({
          where: { contentTransformationId: { in: transformations.map((t) => t.id) } },
        });
        await tx.contentTransformation.deleteMany({ where: { contentArticleId: id } });
      }
      await tx.contentArticle.delete({ where: { id } });
    });

    await triggerRevalidation(tenantId, id, existing.slug);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[moderator/articles DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
