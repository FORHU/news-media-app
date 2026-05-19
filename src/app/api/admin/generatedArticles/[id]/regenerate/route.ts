import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import {
  fetchRegeneratableArticle,
  regenerateGeneratedArticleImage,
  regenerateGeneratedArticleText,
} from "@/lib/regenerateGeneratedArticle";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BodySchema = z.object({
  type: z.enum(["text", "image"]),
  generationPrompt: z.string().optional().or(z.literal("")),
});

async function revalidateArticle(tenantId: string, articleId: string, slug?: string | null) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { domain: true },
    });
    if (!tenant?.domain) return;
    const domain = tenant.domain;
    revalidatePath(`/${domain}`);
    revalidatePath(`/${domain}/search`);
    revalidatePath(`/${domain}/article/${articleId}`);
    if (slug) revalidatePath(`/${domain}/article/${slug}`);
  } catch (error) {
    console.error("[Regenerate] Revalidate error:", error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const article = await fetchRegeneratableArticle(id, tenantId);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const { type, generationPrompt } = parsed.data;
    const prompt =
      typeof generationPrompt === "string" ? generationPrompt.trim() : undefined;

    const updated =
      type === "text"
        ? await regenerateGeneratedArticleText(article, tenantId, {
            generationPrompt: prompt,
          })
        : await regenerateGeneratedArticleImage(article, tenantId, {
            generationPrompt: prompt,
          });

    await revalidateArticle(tenantId, updated.id, updated.slug);

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("[Regenerate]", error);
    const message =
      error instanceof Error ? error.message : "Regeneration failed";
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "AI request timed out. Please try again." : message },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
