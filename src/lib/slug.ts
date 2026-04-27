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
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => {
      if (!word) return false;
      if (/^\d+$/.test(word)) return true;
      // Drop one-letter leftovers like trailing "s" from noisy titles.
      return word.length > 1;
    });
}

function pickSlugWords(title: string, minWords = 3, maxWords = 5): string[] {
  const words = normalizeWords(title);
  const preferred = words.filter((word) => !STOP_WORDS.has(word));
  const pool = preferred.length >= minWords ? preferred : words;
  return pool.slice(0, maxWords);
}

function buildBaseSlug(title: string, date: Date): string {
  const words = pickSlugWords(title);
  const wordsPart = words.length > 0 ? words.join("-") : "article";
  return `${toDatePart(date)}-${wordsPart}`.replace(/-+/g, "-");
}

export async function generateUniqueArticleSlug(
  prisma: any,
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
