import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { sendWebhookCallback } from "@/lib/webhook";
import { revalidatePath } from "next/cache";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { TENANT_CATEGORIES, CATEGORY_TRANSLATIONS } from "@/config/categories";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JEJU_SITES = [
  { domain: "jejutime.com",  language: "English" },
  { domain: "voicejeju.com", language: "Korean" },
  { domain: "jejuqq.com",    language: "Chinese (Simplified)" },
  { domain: "jejujapan.com", language: "Japanese" },
] as const;

function detectLanguage(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ");
  let korean = 0, hiraganaKatakana = 0, cjk = 0, latin = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0xAC00 && cp <= 0xD7A3) korean++;
    else if ((cp >= 0x3040 && cp <= 0x309F) || (cp >= 0x30A0 && cp <= 0x30FF)) hiraganaKatakana++;
    else if (cp >= 0x4E00 && cp <= 0x9FFF) cjk++;
    else if ((cp >= 0x41 && cp <= 0x5A) || (cp >= 0x61 && cp <= 0x7A)) latin++;
  }
  const total = korean + hiraganaKatakana + cjk + latin;
  if (total === 0) return "English";
  if (korean / total > 0.08) return "Korean";
  if (hiraganaKatakana / total > 0.05) return "Japanese";
  if (cjk / total > 0.08) return "Chinese (Simplified)";
  return "English";
}

const JEJUTIME_NAMES = TENANT_CATEGORIES["jejutime.com"];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toEnglishCategory(categoryName: string, sourceDomain: string): string | null {
  if (sourceDomain.includes("jejutime.com")) return categoryName;
  return CATEGORY_TRANSLATIONS[categoryName] ?? null;
}

function categoryForDomain(englishName: string, domain: string): string | null {
  const idx = JEJUTIME_NAMES.findIndex(
    (n) => n.toLowerCase() === englishName.toLowerCase()
  );
  if (idx === -1) return null;
  return TENANT_CATEGORIES[domain as keyof typeof TENANT_CATEGORIES]?.[idx] ?? null;
}

async function translate(
  baseUrl: string,
  title: string,
  content: string,
  targetLanguage: string,
  sourceLanguage: string
): Promise<{ title: string; content: string }> {
  if (targetLanguage === sourceLanguage) return { title, content };

  const sessionRes = await fetch(`${baseUrl}/session-id`);
  if (!sessionRes.ok) throw new Error(`Could not get AI session for ${targetLanguage}`);
  const { session_id } = await sessionRes.json();

  const prompt = `Translate the article title and content below into ${targetLanguage}.
Use natural ${targetLanguage} phrasing as a professional journalist would write it.
Keep the same meaning, facts, and approximate length.

YOU MUST respond using EXACTLY this format and nothing else — no explanation, no extra text:
<title>translated title here</title>
<content>translated content here</content>

Title: ${title}

Content:
${content}`;

  const res = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_input: prompt,
      session_id,
      persona_prefix: "NewsLetter",
      document_context: "",
      image_context: "",
    }),
  });

  if (!res.ok) throw new Error(`Translation request failed for ${targetLanguage}`);

  const data = await res.json();
  const response: string = data?.response ?? data?.text ?? data?.content ?? "";

  const xmlTitle = response.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const xmlContent = response.match(/<content>([\s\S]*?)<\/content>/i)?.[1]?.trim();
  if (xmlTitle && xmlContent) return { title: xmlTitle, content: xmlContent };

  const fwTitle = response.match(/＜title＞([\s\S]*?)＜\/title＞/i)?.[1]?.trim();
  const fwContent = response.match(/＜content＞([\s\S]*?)＜\/content＞/i)?.[1]?.trim();
  if (fwTitle && fwContent) return { title: fwTitle, content: fwContent };

  const lines = response.trim().split("\n").filter((l) => l.trim());
  if (lines.length >= 2) {
    const guessedTitle = lines[0].replace(/^(title|제목|标题|タイトル)\s*[:：]\s*/i, "").trim();
    const guessedContent = lines.slice(1).join("\n").replace(/^(content|내용|内容|本文)\s*[:：]\s*/i, "").trim();
    if (guessedTitle && guessedContent) return { title: guessedTitle, content: guessedContent };
  }

  console.error(`[external/approve:translate] Could not parse ${targetLanguage} response:`, response?.slice(0, 300));
  return { title, content };
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "admin") {
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

    const publishDate = new Date();
    let totalApproved = 0;

    for (const source of sourceArticles) {
      const sourceDomain = source.tenant?.domain ?? "";
      const sourceLanguage = detectLanguage(source.content);
      const sourceCategoryName = source.category?.categoryName ?? "";
      const englishCategory = toEnglishCategory(sourceCategoryName, sourceDomain);

      console.log(
        `[external/approve] ▶ "${source.title}" | src: ${sourceDomain} (${sourceLanguage}) | category: "${sourceCategoryName}" → EN: "${englishCategory}"`
      );

      // Process ALL 4 sites — including the source site so content is always
      // in the correct language regardless of what language was submitted
      for (const site of JEJU_SITES) {
        const isSourceSite = site.domain === sourceDomain;

        // Resolve tenant
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

        // Resolve category for this site
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

        // For the source site we already have the category from the original article
        if (!targetCategoryId && !isSourceSite) continue;

        // Rate-limit AI calls
        await sleep(1500);

        const translated = await translate(
          baseUrl,
          source.title,
          source.content,
          site.language,
          sourceLanguage
        );

        if (isSourceSite) {
          // Update the original article with the correctly-languaged content and publish it
          await prisma.contentArticle.update({
            where: { id: source.id },
            data: {
              title: translated.title,
              content: translated.content,
              status: "published",
              publishDate,
            },
          });
          totalApproved++;
          console.log(`[external/approve] ✅ Published original | domain: ${site.domain} | lang: ${site.language}`);
        } else {
          // Ensure a bot user exists for this tenant
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

          const slug = await generateUniqueArticleSlug(prisma, translated.title, publishDate);

          await prisma.contentArticle.create({
            data: {
              tenantId: tenant.id,
              usersId: botUser.id,
              categoryId: targetCategoryId!,
              title: translated.title,
              content: translated.content,
              imageUrl: source.imageUrl ?? null,
              slug,
              sourceType: "EXTERNAL",
              status: "published",
              publishDate,
            },
          });

          console.log(
            `[external/approve] ✅ Published | domain: ${site.domain} | lang: ${site.language} | title: "${translated.title}"`
          );
        }
      }

      // Revalidate all 4 site paths
      for (const site of JEJU_SITES) {
        try { revalidatePath(`/${site.domain}`, "page"); } catch { /* non-fatal */ }
      }
      if (source.slug && sourceDomain) {
        try { revalidatePath(`/${sourceDomain}/article/${source.slug}`, "page"); } catch { /* non-fatal */ }
      }

      // Send approval callback to wasba.net
      const sub = source.externalSubmission;
      if (sub?.callbackUrl) {
        const articleUrl =
          source.slug && sourceDomain
            ? `https://${sourceDomain}/article/${source.slug}`
            : undefined;
        const result = await sendWebhookCallback(sub.callbackUrl, {
          externalArticleId: sub.externalArticleId,
          status: "approved",
          articleUrl,
        });
        prisma.externalArticleSubmission
          .update({
            where: { id: sub.id },
            data: {
              callbackStatus: result.success ? "sent" : "failed",
              callbackSentAt: new Date(),
            },
          })
          .catch(() => {});
      }
    }

    return NextResponse.json({ success: true, approved: totalApproved });
  } catch (error) {
    console.error("[admin/external/approve]", error);
    return NextResponse.json({ error: "Failed to approve articles" }, { status: 500 });
  }
}
