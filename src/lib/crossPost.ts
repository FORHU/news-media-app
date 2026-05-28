import { TENANT_CATEGORIES, CATEGORY_TRANSLATIONS } from "@/config/categories";

export const JEJU_SITES = [
  { domain: "jejutime.com",  language: "English" },
  { domain: "voicejeju.com", language: "Korean" },
  { domain: "jejuqq.com",    language: "Chinese (Simplified)" },
  { domain: "jejujapan.com", language: "Japanese" },
] as const;

export type JejuSite = (typeof JEJU_SITES)[number];

const JEJUTIME_NAMES = TENANT_CATEGORIES["jejutime.com"];

export function detectLanguage(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ");
  let korean = 0, hiraganaKatakana = 0, cjk = 0, latin = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0xac00 && cp <= 0xd7a3) korean++;
    else if ((cp >= 0x3040 && cp <= 0x309f) || (cp >= 0x30a0 && cp <= 0x30ff)) hiraganaKatakana++;
    else if (cp >= 0x4e00 && cp <= 0x9fff) cjk++;
    else if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)) latin++;
  }
  const total = korean + hiraganaKatakana + cjk + latin;
  if (total === 0) return "English";
  if (korean / total > 0.08) return "Korean";
  if (hiraganaKatakana / total > 0.05) return "Japanese";
  if (cjk / total > 0.08) return "Chinese (Simplified)";
  return "English";
}

export function toEnglishCategory(categoryName: string, sourceDomain: string): string | null {
  if (sourceDomain.includes("jejutime.com")) return categoryName;
  return CATEGORY_TRANSLATIONS[categoryName] ?? null;
}

export function categoryForDomain(englishName: string, domain: string): string | null {
  const idx = JEJUTIME_NAMES.findIndex((n) => n.toLowerCase() === englishName.toLowerCase());
  if (idx === -1) return null;
  return TENANT_CATEGORIES[domain as keyof typeof TENANT_CATEGORIES]?.[idx] ?? null;
}

export async function translate(
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

  console.error(`[crossPost:translate] Could not parse ${targetLanguage} response:`, response?.slice(0, 300));
  return { title, content };
}
