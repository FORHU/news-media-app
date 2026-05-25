import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyApiKey } from "@/lib/apiKeyAuth";
import { externalArticleSubmissionSchema } from "@/lib/validation/externalArticle";
import { generateUniqueArticleSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawKey = req.headers.get("x-api-key") ?? "";
    const keyPayload = await verifyApiKey(rawKey);
    if (!keyPayload) {
      return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
    }
    const { tenantId, sourceName } = keyPayload;

    const body = await req.json().catch(() => null);
    const parsed = externalArticleSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { title, content, categorySlug, imageUrl, externalArticleId, callbackUrl } = parsed.data;

    const category = await prisma.category.findFirst({
      where: { tenantId, categoryName: { equals: categorySlug, mode: "insensitive" } },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json(
        { error: `Category "${categorySlug}" not found for this tenant` },
        { status: 404 }
      );
    }

    const existing = await prisma.externalArticleSubmission.findFirst({
      where: { externalArticleId, contentArticle: { tenantId } },
      select: { contentArticleId: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Article already submitted", articleId: existing.contentArticleId },
        { status: 409 }
      );
    }

    const botEmail = `external-bot@${tenantId}.internal`;
    const botUser = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: botEmail } },
      update: {},
      create: {
        tenantId,
        email: botEmail,
        firstName: "External",
        lastName: "Bot",
        role: "external_bot",
        password: "",
      },
      select: { id: true },
    });

    const slug = await generateUniqueArticleSlug(prisma, title, new Date());

    const article = await prisma.$transaction(async (tx) => {
      const created = await tx.contentArticle.create({
        data: {
          tenantId,
          usersId: botUser.id,
          categoryId: category.id,
          title,
          content,
          imageUrl: imageUrl ?? null,
          slug,
          sourceType: "EXTERNAL",
          status: "pending",
        },
        select: { id: true },
      });

      await tx.externalArticleSubmission.create({
        data: {
          contentArticleId: created.id,
          sourcePlatform: sourceName,
          externalArticleId,
          callbackUrl: callbackUrl ?? null,
        },
      });

      return created;
    });

    return NextResponse.json(
      { articleId: article.id, status: "pending", message: "Webhook received. Article pending review." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[webhooks/external POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
