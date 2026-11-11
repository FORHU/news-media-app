import { RETIRED_ARTICLES, type RetiredArticleMap } from "@/config/retiredArticles";

export type RetiredResolution =
  | { status: 301; location: string }
  | { status: 410 };

const ARTICLE_PREFIX = "/article/";

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Look a request path up in the retired-article map. Pure: no DB, no
 * request objects, safe to call from proxy.ts. Returns null for every URL that
 * is not a retired article (including all live articles).
 */
export function resolveRetiredArticle(
  domain: string | null | undefined,
  pathname: string,
  map: RetiredArticleMap = RETIRED_ARTICLES
): RetiredResolution | null {
  if (!domain || !pathname.startsWith(ARTICLE_PREFIX)) return null;
  const entries = map[domain.toLowerCase()];
  if (!entries) return null;

  const slug = safeDecode(pathname.slice(ARTICLE_PREFIX.length).replace(/\/+$/, ""));
  if (!slug || slug.includes("/")) return null;
  const normalized = slug.normalize("NFC");

  let hit: string | null | undefined;
  if (Object.prototype.hasOwnProperty.call(entries, normalized)) {
    hit = entries[normalized];
  } else {
    for (const [key, value] of Object.entries(entries)) {
      if (key.endsWith("*") && normalized.startsWith(key.slice(0, -1).normalize("NFC"))) {
        hit = value;
        break;
      }
    }
  }

  if (hit === undefined) return null;
  if (hit === null) return { status: 410 };
  return { status: 301, location: `${ARTICLE_PREFIX}${encodeURIComponent(hit)}` };
}

/** Minimal 410 body: no canonical, no site chrome, never indexable. */
export function goneResponseHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>410 Gone</title></head><body><h1>410</h1><p>This page has been permanently removed.</p><p><a href="/">Home</a></p></body></html>`;
}
