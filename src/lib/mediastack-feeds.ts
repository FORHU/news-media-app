import { fetchMediaStackNews, type MediaStackArticle } from "@/lib/mediastack";
import { isTechNewsDomain } from "@/components/sites/technews-shared/theme";

/**
 * The MediaStack pull for a technews-family domain.
 *
 * TechOggi (Italian) and TechHoy (Spanish) both hit the same MediaStack
 * limitation: the "technology" category filter is populated almost entirely
 * from English-language sources, so combined with a non-English `languages`
 * filter it returns either zero results (Italian) or a thin, stale trickle from
 * a single source (Spanish — ~291 total matches, the newest over a week old, so
 * it could never out-rank a site's own recent articles on the homepage).
 * Searching by keyword instead — same technique legalhyper.com already uses for
 * its niche topic — pulls from MediaStack's full non-English index and returns
 * dense, same-day results.
 */
async function fetchTechNewsFeed(domain: string): Promise<MediaStackArticle[]> {
  if (domain === "techoggi.com") {
    return fetchMediaStackNews({
      keywords: "tecnologia",
      languages: "it",
      limit: 100,
      // 99/100 unfiltered results come from zazoom.it, a generic
      // aggregator, not a real publisher — it supplies no direct image
      // (0/100) and hammering one domain ~100x in a single burst is what
      // was getting the scrape rate-limited/blocked in production.
      // Excluding it spreads requests across ~17 real Italian tech
      // publishers (hdblog, ilfattoquotidiano, webnews, ...) and already
      // yields images for ~27% directly from the API.
      sources: "-zazoom",
      // Don't drop text-only-safe rows (the ticker) just because the
      // scrape failed, and give more candidates a shot at the paid
      // Microlink fallback since the free scrape alone was clearing out
      // ~99% of articles here.
      requireImage: false,
      microlinkLimit: 15,
    });
  }
  if (domain === "techhoy.com") {
    return fetchMediaStackNews({ keywords: "tecnologia", languages: "es", limit: 100 });
  }
  return fetchMediaStackNews({ categories: "technology", languages: "en", limit: 100 });
}

/**
 * The MediaStack feed a domain's pages are built from, or null when the domain
 * doesn't use MediaStack. The single source for the home and search pages, so
 * both make the identical request (and share its 24h fetch cache) instead of
 * drifting apart. legalhyper.com is not here: it has its own keyword feed and
 * article mapping.
 */
export async function fetchDomainMediaStackFeed(domain: string): Promise<MediaStackArticle[] | null> {
  if (isTechNewsDomain(domain)) return fetchTechNewsFeed(domain);
  if (domain === "newsicons.com" || domain === "skyblueprime.com") {
    return fetchMediaStackNews({ categories: "technology", languages: "en", limit: 100 });
  }
  if (domain === "lavaguetech.com") {
    return fetchMediaStackNews({ categories: "technology", limit: 50 });
  }
  return null;
}
