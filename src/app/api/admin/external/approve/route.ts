import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateUniqueArticleSlug } from "@/lib/slug";
import {
  JEJU_SITES,
  detectLanguage,
  toEnglishCategory,
  categoryForDomain,
  translate,
} from "@/lib/crossPost";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || (payload.role !== "admin" && payload.role !== "moderator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleIds } = await req.json();
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: "articleIds is required" }, { status: 400 });
    }

    const baseUrl = (process.env.GENERATE_CONTENT_API ?? "").replace(/\/$/, "");
    if (!baseUrl) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 500 });
    }

    const sourceArticles = await prisma.contentArticle.findMany({
      where: { id: { in: articleIds }, sourceType: "EXTERNAL", status: "pending" },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        imageUrls: true,
        slug: true,
        tenant: { select: { id: true, domain: true } },
        category: { select: { categoryName: true } },
        externalSubmission: {
          select: { id: true, externalArticleId: true, callbackUrl: true },
        },
      },
    });

    if (sourceArticles.length === 0) {
      return NextResponse.json({ error: "No pending external articles found." }, { status: 404 });
    }

    // Shared batch timestamp — used to group all 4 drafts together in the UI
    const draftDate = new Date();
    let totalDrafted = 0;

    for (const source of sourceArticles) {
      const sourceDomain = source.tenant?.domain ?? "";
      const sourceLanguage = detectLanguage(source.content);
      const sourceCategoryName = source.category?.categoryName ?? "";
      const englishCategory = toEnglishCategory(sourceCategoryName, sourceDomain);

      console.log(
        `[external/approve] ▶ "${source.title}" | src: ${sourceDomain} (${sourceLanguage}) | category: "${sourceCategoryName}" → EN: "${englishCategory}"`
      );

      for (const site of JEJU_SITES) {
        const isSourceSite = site.domain === sourceDomain;

        const tenant = isSourceSite
          ? { id: source.tenant!.id }
          : await prisma.tenant.findUnique({
              where: { domain: site.domain },
              select: { id: true },
            });

        if (!tenant) {
          console.warn(`[external/approve] ⚠ Tenant not found: ${site.domain}, skipping.`);
          continue;
        }

        let targetCategoryId: string | null = null;
        if (englishCategory) {
          const localName = categoryForDomain(englishCategory, site.domain);
          if (localName) {
            const cat = await prisma.category.findFirst({
              where: {
                tenantId: tenant.id,
                categoryName: { equals: localName, mode: "insensitive" },
              },
              select: { id: true },
            });
            if (cat) {
              targetCategoryId = cat.id;
            } else {
              console.warn(`[external/approve] ⚠ Category "${localName}" not in DB for ${site.domain}, skipping.`);
            }
          } else {
            console.warn(`[external/approve] ⚠ No category mapping for "${englishCategory}" → ${site.domain}, skipping.`);
          }
        }

        if (!targetCategoryId && !isSourceSite) continue;

        await sleep(1500);

        const translated = await translate(
          baseUrl,
          source.title,
          source.content,
          site.language,
          sourceLanguage
        );

        if (isSourceSite) {
          await prisma.contentArticle.update({
            where: { id: source.id },
            data: {
              title: translated.title,
              content: translated.content,
              status: "draft",
              publishDate: draftDate,
            },
          });
          totalDrafted++;
          console.log(`[external/approve] 📝 Drafted original | domain: ${site.domain} | lang: ${site.language}`);
        } else {
          const botEmail = `external-bot@${tenant.id}.internal`;
          const botUser = await prisma.user.upsert({
            where: { tenantId_email: { tenantId: tenant.id, email: botEmail } },
            update: {},
            create: {
              tenantId: tenant.id,
              email: botEmail,
              firstName: "External",
              lastName: "Bot",
              role: "external_bot",
              password: "",
            },
            select: { id: true },
          });

          const slug = await generateUniqueArticleSlug(prisma, translated.title, draftDate);

          await prisma.contentArticle.create({
            data: {
              tenantId: tenant.id,
              usersId: botUser.id,
              categoryId: targetCategoryId!,
              title: translated.title,
              content: translated.content,
              imageUrl: source.imageUrl ?? null,
              imageUrls: source.imageUrls ?? [],
              slug,
              sourceType: "EXTERNAL",
              status: "draft",
              publishDate: draftDate,
            },
          });

          console.log(
            `[external/approve] 📝 Drafted | domain: ${site.domain} | lang: ${site.language} | title: "${translated.title}"`
          );
        }
      }

      // Revalidate paths so draft articles are visible in admin
      for (const site of JEJU_SITES) {
        try { revalidatePath(`/${site.domain}`, "page"); } catch { /* non-fatal */ }
      }
    }

    return NextResponse.json({ success: true, drafted: totalDrafted });
  } catch (error) {
    console.error("[admin/external/approve]", error);
    return NextResponse.json({ error: "Failed to approve articles" }, { status: 500 });
  }
}
