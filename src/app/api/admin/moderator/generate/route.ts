import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";
import { generateUniqueArticleSlug } from "@/lib/slug";
import { TENANT_CATEGORIES } from "@/config/categories";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Per-domain config: which language to translate to
const SITE_CONFIG = [
  { domain: "jejutime.com",  language: "English",            flag: "🇺🇸" },
  { domain: "voicejeju.com", language: "Korean",             flag: "🇰🇷" },
  { domain: "jejuqq.com",    language: "Chinese (Simplified)", flag: "🇨🇳" },
  { domain: "jejujapan.com", language: "Japanese",           flag: "🇯🇵" },
] as const;

const JEJUTIME_NAMES = TENANT_CATEGORIES["jejutime.com"];

const DATA_URL_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

function detectExt(mime: string) {
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

async function uploadBase64ToS3(dataUrl: string, tenantId: string): Promise<string> {
  const match = dataUrl.match(DATA_URL_REGEX);
  if (!match) throw new Error("Invalid base64 image.");
  const mime = match[1];
  const buf = Buffer.from(match[2], "base64");
  const ext = detectExt(mime);
  const name = `moderator-${tenantId}-${Date.now()}-${randomUUID()}.${ext}`;
  return uploadToS3(buf, name, mime);
}

// Returns the category name for a given domain matching the English name by index
function getCategoryNameForDomain(englishName: string, domain: string): string | null {
  const idx = JEJUTIME_NAMES.findIndex(
    (n) => n.toLowerCase() === englishName.toLowerCase()
  );
  if (idx === -1) return null;
  const domainNames = TENANT_CATEGORIES[domain as keyof typeof TENANT_CATEGORIES];
  return domainNames?.[idx] ?? null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Translate title + content using the AI service — gets its own fresh session
async function translate(
  baseUrl: string,
  title: string,
  content: string,
  targetLanguage: string
): Promise<{ title: string; content: string }> {
  if (targetLanguage === "English") return { title, content };

  const sessionRes = await fetch(`${baseUrl}/session-id`);
  if (!sessionRes.ok) throw new Error(`Could not get session for ${targetLanguage} translation.`);
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

  if (!res.ok) throw new Error(`Translation failed for ${targetLanguage}`);

  const data = await res.json();
  const response: string = data?.response ?? data?.text ?? data?.content ?? "";

  // Strategy 1: standard XML tags
  const xmlTitle = response.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const xmlContent = response.match(/<content>([\s\S]*?)<\/content>/i)?.[1]?.trim();
  if (xmlTitle && xmlContent) return { title: xmlTitle, content: xmlContent };

  // Strategy 2: fullwidth angle brackets (some Asian-language AI responses use ＜＞)
  const fwTitle = response.match(/＜title＞([\s\S]*?)＜\/title＞/i)?.[1]?.trim();
  const fwContent = response.match(/＜content＞([\s\S]*?)＜\/content＞/i)?.[1]?.trim();
  if (fwTitle && fwContent) return { title: fwTitle, content: fwContent };

  // Strategy 3: first non-empty line = title, remaining text = content
  const lines = response.trim().split("\n").filter((l) => l.trim());
  if (lines.length >= 2) {
    const guessedTitle = lines[0].replace(/^(title|제목|标题|タイトル)\s*[:：]\s*/i, "").trim();
    const guessedContent = lines.slice(1).join("\n").replace(/^(content|내용|内容|本文)\s*[:：]\s*/i, "").trim();
    if (guessedTitle && guessedContent) return { title: guessedTitle, content: guessedContent };
  }

  console.error(`[translate:${targetLanguage}] Could not extract translation. Raw response:`, response?.slice(0, 500));
  return { title, content };
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, categoryName, s3ImageUrl } = await req.json();

    if (!title?.trim() || !content?.trim() || !categoryName?.trim()) {
      return NextResponse.json({ error: "title, content, and categoryName are required." }, { status: 400 });
    }

    const baseUrl = (process.env.GENERATE_CONTENT_API || "").replace(/\/$/, "");
    if (!baseUrl) return NextResponse.json({ error: "AI service not configured." }, { status: 500 });

    // Upload image once, reuse the S3 URL across all 4 sites
    let resolvedImageUrl: string | null = null;
    if (s3ImageUrl?.trim()) {
      if (s3ImageUrl.startsWith("data:image/")) {
        resolvedImageUrl = await uploadBase64ToS3(s3ImageUrl, "moderator");
      } else {
        resolvedImageUrl = s3ImageUrl;
      }
    }

    // Process all 4 domains sequentially so the AI service isn't overwhelmed
    const results = [];
    for (const { domain, language, flag } of SITE_CONFIG) {
      // 1. Resolve tenant
      const tenant = await prisma.tenant.findUnique({
        where: { domain },
        select: { id: true },
      });
      if (!tenant) throw new Error(`Tenant not found for domain: ${domain}`);

      // 2. Resolve category for this domain
      const localCategoryName = getCategoryNameForDomain(categoryName, domain);
      if (!localCategoryName) throw new Error(`Category "${categoryName}" not mapped for ${domain}`);

      const category = await prisma.category.findFirst({
        where: {
          tenantId: tenant.id,
          categoryName: { equals: localCategoryName, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (!category) throw new Error(`Category not found in DB for ${domain}: ${localCategoryName}`);

      // 3. Translate — pause between calls to avoid AI service rate limits
      if (language !== "English") await sleep(1500);
      const translated = await translate(baseUrl, title, content, language);

      // 4. Find a user for this tenant — prefer moderator, fall back to any user
      const user =
        (await prisma.user.findFirst({ where: { tenantId: tenant.id, role: "moderator" }, select: { id: true } })) ??
        (await prisma.user.findFirst({ where: { tenantId: tenant.id }, select: { id: true } }));
      if (!user) throw new Error(`No user found for tenant: ${domain}`);

      // 5. Save article as pending
      const publishDate = new Date();
      const slug = await generateUniqueArticleSlug(prisma, translated.title, publishDate);

      const article = await prisma.contentArticle.create({
        data: {
          tenantId: tenant.id,
          usersId: user.id,
          categoryId: category.id,
          title: translated.title,
          slug,
          publishDate,
          imageUrl: resolvedImageUrl,
          content: translated.content,
          status: "pending",
          sourceType: "MANUAL",
        },
      });

      results.push({
        domain,
        language,
        flag,
        id: article.id,
        title: article.title,
        content: article.content,
        imageUrl: article.imageUrl,
      });
    }

    return NextResponse.json({ articles: results });
  } catch (error: any) {
    console.error("[moderator/generate] Error:", error);
    return NextResponse.json({ error: error?.message || "Generation failed." }, { status: 500 });
  }
}
