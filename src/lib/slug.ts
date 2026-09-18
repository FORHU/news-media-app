import type { PrismaClient } from "@/generated/prisma";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
]);

function toDatePart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeWords(title: string): string[] {
  return title
    .toLowerCase()
    // Convert possessives like "civilization's" into "civilization"
    .replace(/['’]s\b/g, "")
    // Remove punctuation and special characters, but preserve letters/numbers from ALL languages
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => {
      if (!word) return false;
      if (/^\d+$/.test(word)) return true;
      // Drop one-letter leftovers like trailing "s" from noisy titles.
      // We allow single characters for CJK languages as they are often full words.
      return word.length >= 1;
    });
}

/**
 * Word count is not a fair budget across scripts: English titles split into
 * many short whitespace-separated words, while Korean packs more meaning per
 * word and Japanese/Chinese often have no spaces at all (so a "word" here can
 * be an entire uncut clause). A fixed word cap was truncating Korean titles
 * mid-clause — dropping the actual news hook — while barely touching
 * Japanese/Chinese ones. A character budget normalizes for that: it keeps at
 * least `minWords` words no matter what (so a title with one giant unspaced
 * token still gets a slug), then adds further words only while they fit.
 */
function pickSlugWords(title: string, minWords = 3, maxChars = 60): string[] {
  const words = normalizeWords(title);
  const preferred = words.filter((word) => !STOP_WORDS.has(word));
  const pool = preferred.length >= minWords ? preferred : words;

  const selected: string[] = [];
  let length = 0;
  for (const word of pool) {
    const nextLength = length + (selected.length > 0 ? 1 : 0) + word.length;
    if (selected.length >= minWords && nextLength > maxChars) break;
    selected.push(word);
    length = nextLength;
  }
  return selected;
}

function buildBaseSlug(title: string, date: Date): string {
  const words = pickSlugWords(title);
  const wordsPart = words.length > 0 ? words.join("-") : "article";
  return `${toDatePart(date)}-${wordsPart}`.replace(/-+/g, "-");
}

export async function generateUniqueArticleSlug(
  prisma: PrismaClient,
  title: string,
  date: Date = new Date()
): Promise<string> {
  const base = buildBaseSlug(title, date);
  let candidate = base;
  let suffix = 2;

  // Prisma client might still be stale in some environments, so guard lookup.
  while (true) {
    try {
      const existing = await prisma.contentArticle.findFirst({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing) return candidate;
      candidate = `${base}-${suffix}`;
      suffix += 1;
    } catch {
      return candidate;
    }
  }
}
