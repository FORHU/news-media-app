import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyApiKey } from "@/lib/apiKeyAuth";
import {
  externalArticleSubmissionSchema,
  multiArticleSubmissionSchema,
} from "@/lib/validation/externalArticle";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const LANGUAGE_TO_DOMAIN: Record<string, string> = {
  ko:                     "voicejeju.com",
  korean:                 "voicejeju.com",
  "한국어":               "voicejeju.com",

  en:                     "jejutime.com",
  english:                "jejutime.com",

  ja:                     "jejujapan.com",
  japanese:               "jejujapan.com",
  "日本語":               "jejujapan.com",

  zh:                     "jejuqq.com",
  "zh-cn":                "jejuqq.com",
  chinese:                "jejuqq.com",
  "chinese (simplified)": "jejuqq.com",
  "中文":                 "jejuqq.com",
};

function resolveTargetDomain(language?: string | null, fallbackDomain?: string): string | null {
  if (!language) return fallbackDomain ?? null;
  return LANGUAGE_TO_DOMAIN[language.toLowerCase().trim()] ?? fallbackDomain ?? null;
}

async function createArticleForEntry({
  tenantId,
  tenantDomain,
  categorySlug,
  title,
  content,
  imageUrls,
  language,
  externalArticleId,
  callbackUrl,
  sourceName,
  autoPublish,
}: {
  tenantId: string;
  tenantDomain: string;
  categorySlug: string;
  title: string;
  content: string;
  imageUrls?: string[];
  language: string;
  externalArticleId: string;
  callbackUrl?: string | null;
  sourceName: string;
  autoPublish: boolean;
}) {
  const category = await prisma.category.findFirst({
    where: { tenantId, categoryName: { equals: categorySlug, mode: "insensitive" } },
    select: { id: true },
  });
  if (!category) {
    return { error: `Category "${categorySlug}" not found on ${tenantDomain}` };
  }

  const existing = await prisma.externalArticleSubmission.findFirst({
    where: { externalArticleId, contentArticle: { tenantId } },
    select: { contentArticleId: true },
  });
  if (existing) {
    return { error: "Article already submitted", articleId: existing.contentArticleId, skipped: true };
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

  const publishDate = new Date();
  const slug = await generateUniqueArticleSlug(prisma, title, publishDate);
  const status = autoPublish ? "published" : "pending";
  const primaryImageUrl = imageUrls?.[0] ?? null;

  const article = await prisma.$transaction(async (tx) => {
    const created = await tx.contentArticle.create({
      data: {
        tenantId,
        usersId: botUser.id,
        categoryId: category.id,
        title,
        content,
        imageUrl: primaryImageUrl,
        imageUrls: imageUrls ?? [],
        slug,
        sourceType: "EXTERNAL",
        status,
        publishDate: autoPublish ? publishDate : null,
      },
      select: { id: true },
    });

    await tx.externalArticleSubmission.create({
      data: {
        contentArticleId: created.id,
        sourcePlatform: sourceName,
        externalArticleId,
        submittedLanguage: language,
        callbackUrl: callbackUrl ?? null,
      },
    });

    return created;
  });

  if (autoPublish) {
    try {
      revalidatePath(`/${tenantDomain}`);
      revalidatePath(`/${tenantDomain}/article/${slug}`);
      revalidatePath(`/${tenantDomain}`, "layout");
    } catch { /* non-fatal */ }
  }

  return {
    articleId: article.id,
    status,
    language,
    site: tenantDomain,
    ...(autoPublish
      ? { articleUrl: `https://${tenantDomain}/article/${slug}` }
      : { message: "Article received and pending review." }),
  };
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const rawKey = req.headers.get("x-api-key") ?? "";
    const keyPayload = await verifyApiKey(rawKey);
    if (!keyPayload) {
      return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
    }
    const { tenantId: keyTenantId, sourceName, autoPublish } = keyPayload;

    const body = await req.json().catch(() => null);

    // ── Multi-article format ──────────────────────────────────────────────
    const multiParsed = multiArticleSubmissionSchema.safeParse(body);
    if (multiParsed.success) {
      const { externalArticleId, articles, callbackUrl } = multiParsed.data;

      const keyTenant = await prisma.tenant.findUnique({
        where: { id: keyTenantId },
        select: { domain: true },
      });

      const results = await Promise.all(
        articles.map(async (entry) => {
          const targetDomain = resolveTargetDomain(entry.language, keyTenant?.domain);
          if (!targetDomain) {
            return { language: entry.language, error: `Cannot resolve site for language "${entry.language}"` };
          }

          let tenantId = keyTenantId;
          let tenantDomain = keyTenant?.domain ?? "";

          if (targetDomain !== keyTenant?.domain) {
            const targetTenant = await prisma.tenant.findUnique({
              where: { domain: targetDomain },
              select: { id: true, domain: true },
            });
            if (!targetTenant) {
              return { language: entry.language, error: `Site "${targetDomain}" not configured` };
            }
            tenantId = targetTenant.id;
            tenantDomain = targetTenant.domain;
          }

          return createArticleForEntry({
            tenantId,
            tenantDomain,
            categorySlug: entry.categorySlug,
            title: entry.title,
            content: entry.content,
            imageUrls: entry.imageUrls,
            language: entry.language,
            externalArticleId,
            callbackUrl,
            sourceName,
            autoPublish,
          });
        })
      );

      return NextResponse.json({ externalArticleId, results }, { status: 201 });
    }

    // ── Single-article format ─────────────────────────────────────────────
    const parsed = externalArticleSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { title, content, categorySlug, imageUrls, language, externalArticleId, callbackUrl } = parsed.data;

    const keyTenant = await prisma.tenant.findUnique({
      where: { id: keyTenantId },
      select: { domain: true },
    });

    const targetDomain = resolveTargetDomain(language, keyTenant?.domain);
    if (!targetDomain) {
      return NextResponse.json({ error: "Cannot determine target site. Provide a valid language field." }, { status: 400 });
    }

    let tenantId = keyTenantId;
    let tenantDomain = keyTenant?.domain ?? "";

    if (targetDomain !== keyTenant?.domain) {
      const targetTenant = await prisma.tenant.findUnique({
        where: { domain: targetDomain },
        select: { id: true, domain: true },
      });
      if (!targetTenant) {
        return NextResponse.json({ error: `Target site "${targetDomain}" not configured` }, { status: 404 });
      }
      tenantId = targetTenant.id;
      tenantDomain = targetTenant.domain;
    }

    const result = await createArticleForEntry({
      tenantId,
      tenantDomain,
      categorySlug,
      title,
      content,
      imageUrls,
      language: language ?? "",
      externalArticleId,
      callbackUrl,
      sourceName,
      autoPublish,
    });

    if ("error" in result && !("skipped" in result)) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    if ("skipped" in result) {
      return NextResponse.json({ error: result.error, articleId: result.articleId }, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[webhooks/external POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
