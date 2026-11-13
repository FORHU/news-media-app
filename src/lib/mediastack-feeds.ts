import { enrichImages, fetchMediaStackNews, stableHash, type MediaStackArticle } from "@/lib/mediastack";
import { isTechNewsDomain } from "@/components/sites/technews-shared/theme";
import { env } from "@/lib/env";

/**
 * Finished feeds are remembered in memory for the cache window (MEDIASTACK_REVALIDATE_SECONDS,
 * default 4h; 24h under `next dev`). Next caches the MediaStack API responses, but everything
 * built from them (keyword re-check, de-duplication, and above all one article-image scrape per
 * story) was redone on every page render, which made a local page take 10-30s and a cold feed
 * minutes. Simultaneous requests share one in-flight build. The cache lives on globalThis so dev
 * hot-reloads do not wipe it. An empty result is only kept for a minute, so a failed pull heals.
 */
interface FeedCacheEntry {
  at: number;
  ttlMs: number;
  value?: MediaStackArticle[];
  inflight?: Promise<MediaStackArticle[]>;
}
const feedCacheHost = globalThis as typeof globalThis & { __mediaStackFeedCache?: Map<string, FeedCacheEntry> };
const feedCache: Map<string, FeedCacheEntry> = (feedCacheHost.__mediaStackFeedCache ??= new Map());

function feedTtlMs(): number {
  const seconds = env.MEDIASTACK_REVALIDATE_SECONDS ?? (process.env.NODE_ENV === "development" ? 86400 : 14400);
  return seconds * 1000;
}

async function memoFeed(key: string, build: () => Promise<MediaStackArticle[]>): Promise<MediaStackArticle[]> {
  const hit = feedCache.get(key);
  if (hit?.value && Date.now() - hit.at < hit.ttlMs) return hit.value;
  if (hit?.inflight) return hit.inflight;

  const inflight = build()
    .then((value) => {
      feedCache.set(key, { at: Date.now(), ttlMs: value.length > 0 ? feedTtlMs() : 60_000, value });
      return value;
    })
    .catch((err) => {
      feedCache.delete(key);
      throw err;
    });
  feedCache.set(key, { at: Date.now(), ttlMs: 0, inflight });
  return inflight;
}

/** How many of PressBig's newest stories are kept (and image-scraped). */
const PRESSBIG_FEED_LIMIT = 160;

/**
 * MediaStack feed definitions, one list of "pools" per language/site family.
 *
 * MediaStack only returns one coarse tag ("technology", or "general" for
 * non-English), so a site's category blocks can't be filled from a single pull:
 * the keyword classifier would spread ~100 stories over ~10 categories. Instead
 * each pool is one keyword query that stands for one site category — the pool's
 * stories are tagged with that category (`topic`) and every category gets its
 * own ~100 candidates.
 *
 * Quota: each pool is one API call per cache window (MEDIASTACK_REVALIDATE_SECONDS,
 * default 4h => 6/day). 37 pools x 6 x 30 = ~6,700 calls/month, about two thirds
 * of the 10,000/month Standard plan (29 pools before pressbig.com's 8). Adding or removing a pool moves that by ~180/month,
 * so keep this list and that number in step.
 *
 * Keyword choice was probed against the live API, and it matters: MediaStack's
 * keyword search is loose (stemmed), so "developers" returned 100 stories of
 * which only 4 contained the word ("development", "developed" ...), while
 * "software" returned 100 of 100. fetchPools re-checks that every story really
 * contains the keyword, so a loose keyword just leaves the category empty.
 * Single words are fresher than phrases, and some obvious terms are stale in a
 * given language (ES "ciberseguridad", FR "startup"). Re-probe before changing.
 */

interface Pool {
  keywords?: string;
  categories?: string;
  sources?: string;
  /** Site category (in the site's own label language) the pool's stories get. */
  topic?: string;
  requireImage?: boolean;
  microlinkLimit?: number;
  /** Headlines matching this are dropped (a brand's "not that kind of story" list). */
  avoid?: RegExp;
  /** Drop stories that are not written in English (MediaStack's language tag is unreliable). */
  englishOnly?: boolean;
}

/** English tech taxonomy (same labels as TECH_CATEGORIES in config/categories.ts). */
const EN_TECH_POOLS: Pool[] = [
  { keywords: "AI", topic: "Artificial Intelligence" },
  { keywords: "software", topic: "Software Development" },
  { keywords: "smartphone", topic: "Consumer Tech" },
  { keywords: "cybersecurity", topic: "Cybersecurity" },
  { keywords: "startup", topic: "Startups" },
  { keywords: "big tech", topic: "Big Tech" },
  { keywords: "privacy", topic: "Tech Policy" },
  // Two pools: Emerging Tech's own terms are rare in fresh news.
  { keywords: "satellite", topic: "Emerging Tech" },
  { keywords: "drones", topic: "Emerging Tech" },
  { keywords: "social media", topic: "Digital Culture" },
  { keywords: "cloud computing", topic: "Enterprise & Cloud Infrastructure" },
];

/**
 * Every English site pulls the same 10 pools (one cached request each), so
 * without more they would all show identical wire stories. Each site instead
 * keeps a deterministic share of them, chosen by hashing the story URL, so the
 * sites carry different (partially overlapping) subsets of the same cheap pull.
 */
const EN_SITES = [
  "newsicons.com",
  "skyblueprime.com",
  "linktechnews.com",
  "dbtechnews.com",
  "magazinetechy.com",
  "magazineair.com",
  "techygate.com",
  "newyorksignal.com",
];
/** Of EN_SITES.length hash buckets, how many each site keeps. */
const EN_SITE_SHARE = 3;

function sliceForEnglishSite(articles: MediaStackArticle[], domain: string): MediaStackArticle[] {
  const idx = EN_SITES.indexOf(domain);
  if (idx === -1) return articles;
  const n = EN_SITES.length;
  return articles.filter((a) => (((stableHash(a.url) % n) - idx + n) % n) < EN_SITE_SHARE);
}

const DE_POOLS: Pool[] = [
  // Original pull; classified by keyword. The category also carries a "Google
  // News Technology DE" aggregator whose rows have no usable image or direct link.
  { categories: "technology" },
  { keywords: "KI", topic: "Artificial Intelligence" },
  { keywords: "Smartphone", topic: "Consumer Tech" },
];

const ES_POOLS: Pool[] = [
  // "technology" + es is thin and stale, so keyword search the full index instead.
  { keywords: "tecnologia" },
  { keywords: "inteligencia artificial", topic: "Inteligencia Artificial" },
  { keywords: "redes sociales", topic: "Cultura Digital" },
];

const IT_POOLS: Pool[] = [
  // 99/100 unfiltered results come from zazoom.it, a generic aggregator with no
  // direct images that also got our scrapes rate-limited, so exclude it. Italian
  // results never carry a direct image, so keep text-only rows (the ticker) and
  // give the base pull more shots at the Microlink fallback.
  { keywords: "tecnologia", sources: "-zazoom", requireImage: false, microlinkLimit: 15 },
  { keywords: "intelligenza artificiale", sources: "-zazoom", topic: "Intelligenza Artificiale", requireImage: false, microlinkLimit: 3 },
  { keywords: "smartphone", sources: "-zazoom", topic: "Tecnologia di Consumo", requireImage: false, microlinkLimit: 3 },
];

const FR_POOLS: Pool[] = [
  // MediaStack's French "technology" category is stale untagged aggregator
  // output; "intelligence artificielle" comes back recent, on-topic, with images.
  // The home and search pages add the French tech RSS feeds for the rest.
  { keywords: "intelligence artificielle", topic: "Artificial Intelligence" },
  { keywords: "réseaux sociaux", topic: "Digital Culture" },
  { keywords: "smartphone", topic: "Consumer Tech" },
];

/** LegalHyper desks (see LEGALHYPER_DESKS in legalhyper/mockArticles.ts). Order
 *  matters: a story found by several pools keeps the first (most specific) desk. */
const LEGALHYPER_POOLS: Pool[] = [
  { keywords: "AI regulation", topic: "Legal AI" },
  { keywords: "court ruling", topic: "Courts & Litigation" },
  { keywords: "law firm", topic: "Industry Analysis" },
  { keywords: "attorney", topic: "Legal Geek Coverage" },
  { keywords: "regulation", topic: "Regulation & Policy" },
  { keywords: "legal", topic: "LegalTech News" },
];

/** Headline identity for de-duplication: the same wire story is republished by
 *  many outlets under different URLs, usually with the identical headline, or
 *  with a " - Outlet" / " | Outlet" suffix. Case, accents, punctuation and that
 *  trailing outlet name are ignored. */
export function titleKey(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/\s+[-–—|:]\s+[^-–—|:]{2,40}$/u, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** MediaStack's keyword search stems loosely ("developers" also returns
 *  "development" and "developed", so a bridge-construction story lands in
 *  Software Development). Re-check that the story really contains the pool's
 *  keyword as a whole word (optional plural), in its title or description.
 *  Short keywords such as "AI" are case-sensitive so they don't match "ai"
 *  inside other words/languages. */
function mentionsKeyword(a: MediaStackArticle, keyword: string): boolean {
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  const flags = keyword.trim().length <= 3 ? "u" : "iu";
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?:s|es)?(?![\\p{L}\\p{N}])`, flags);
  return re.test(`${a.title} ${a.description ?? ""}`);
}

/**
 * PressBig is entertainment, fashion, gadgets and culture, explicitly not hard
 * news (PRODUCT.md): no crime, death, conflict or politics framing. MediaStack's
 * "Hollywood" and "viral" pools return plenty of it ("Armed intruders break into
 * ... mansion", "... dead at 85", "... after rape conviction"), so headlines
 * with these words are dropped. Title-only and deliberately blunt: it will
 * occasionally cost a harmless headline ("Kill Bill"), which is the cheaper
 * mistake for this brand. Tune the list here.
 */
const PRESSBIG_AVOID =
  /\b(?:rape[ds]?|raping|murder(?:s|ed|er|ers)?|kill(?:s|ed|ing)?|shot|shooting|stabb(?:ed|ing)|arrest(?:s|ed)?|jail(?:ed|s)?|convict(?:ed|ion|ions)|sentenc(?:ed|es|ing)|assault(?:s|ed)?|abus(?:e|es|ed|ing)|dies|died|death|deaths|funeral|found dead|dead at \d+|armed|intruders?|kidnap(?:s|ped|ping)?|bomb(?:s|ing)?|terror(?:ist|ism)?|massacre|suicide|overdose|ceasefire|election|senate|congress|warning|urgent|scam|scammers?|hack(?:ed|ers?)?|breach|outage|lawsuit)\b|\b(?:NYSE|NASDAQ|NYSEARCA|LON|ASX|TSX):|\bshares? (?:of|in)\b|\bstock price\b|\bprice target\b|\b(?:acquires|sells|buys|trims|boosts|lowers|raises) \d[\d,.]* shares\b/i;

/** Stopwords of the languages that slip through MediaStack's languages=en
 *  (Indonesian/Malay, Spanish, Portuguese, French). Three or more in a
 *  headline plus description marks a story as not English. */
const NON_ENGLISH_WORDS =
  /\b(?:yang|dan|dengan|untuk|pada|dari|akan|tidak|adalah|juga|telah|oleh|sebagai|lebih|dalam|para|sudah|bisa|usia|tahun|masih|karena|saat|menjadi|ini|itu|los|las|una|por|con|del|uma|não|nao|dos|das|les|des|une|pour|dans|est|sur)\b/gi;

function looksNonEnglish(text: string): boolean {
  return (text.match(NON_ENGLISH_WORDS) ?? []).length >= 3;
}

/** pressbig.com: two pools per section. Keywords were probed for mention-rate and
 *  freshness; the Gadgets pair is the weakest (few fresh stories per term), so
 *  "iPhone" leads. Order matters: the first pool to find a story names its section. */
const PRESSBIG_POOLS: Pool[] = [
  { keywords: "movie", topic: "Entertainment", avoid: PRESSBIG_AVOID, englishOnly: true },
  { keywords: "album", topic: "Entertainment", avoid: PRESSBIG_AVOID, englishOnly: true },
  { keywords: "fashion", topic: "Fashion & Style", avoid: PRESSBIG_AVOID, englishOnly: true },
  { keywords: "beauty", topic: "Fashion & Style", avoid: PRESSBIG_AVOID, englishOnly: true },
  { keywords: "iPhone", topic: "Gadgets", avoid: PRESSBIG_AVOID, englishOnly: true },
  { keywords: "gadget", topic: "Gadgets", avoid: PRESSBIG_AVOID, englishOnly: true },
  { keywords: "Hollywood", topic: "Celebrity & Culture", avoid: PRESSBIG_AVOID, englishOnly: true },
  { keywords: "viral", topic: "Celebrity & Culture", avoid: PRESSBIG_AVOID, englishOnly: true },
];

/** Runs every pool in parallel (each its own cached request), tags the stories
 *  with the pool's category, drops stories that don't really mention the pool's
 *  keyword, drops duplicate URLs and duplicate headlines (the same story from
 *  several outlets) and returns newest first. */
async function fetchPools(
  languages: string,
  pools: Pool[],
  /** Narrows the merged stories (e.g. a site's share) BEFORE the expensive image
   *  scraping, so only stories that will actually be shown get scraped. */
  select: (articles: MediaStackArticle[]) => MediaStackArticle[] = (a) => a,
): Promise<MediaStackArticle[]> {
  const results = await Promise.all(
    pools.map(async (pool) => {
      let feed = await fetchMediaStackNews({
        languages,
        limit: 100,
        keywords: pool.keywords,
        categories: pool.categories,
        sources: pool.sources,
        // Images are fetched once, below, for the stories that survive.
        enrich: false,
      });
      // Only tagged pools stand for a category; the untagged base pulls are
      // broad on purpose (and "tecnologia" must also match "tecnología").
      if (pool.englishOnly) {
        feed = feed.filter((a) => !looksNonEnglish(`${a.title} ${a.description ?? ""}`));
      }
      if (pool.avoid) {
        const avoid = pool.avoid;
        feed = feed.filter((a) => !avoid.test(a.title));
      }
      if (pool.topic && pool.keywords) {
        const keyword = pool.keywords;
        feed = feed.filter((a) => mentionsKeyword(a, keyword));
      }
      return pool.topic ? feed.map((a) => ({ ...a, topic: pool.topic })) : feed;
    }),
  );

  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const merged: MediaStackArticle[] = [];
  for (const feed of results) {
    for (const a of feed) {
      const key = titleKey(a.title);
      if (seenUrls.has(a.url) || (key && seenTitles.has(key))) continue;
      seenUrls.add(a.url);
      if (key) seenTitles.add(key);
      merged.push(a);
    }
  }
  merged.sort((x, y) => new Date(y.publishedAt).getTime() - new Date(x.publishedAt).getTime());

  return enrichImages(select(merged), {
    // A pull that opts out of the image requirement (Italian: its sources never
    // send an image, and the ticker only needs text) keeps imageless stories.
    requireImage: pools.every((p) => p.requireImage === false) ? false : undefined,
    microlinkLimit: Math.max(...pools.map((p) => p.microlinkLimit ?? 2)),
    label: `${languages}/${pools.length} pools`,
  });
}

async function fetchTechNewsFeed(domain: string): Promise<MediaStackArticle[]> {
  if (domain === "techoggi.com") return fetchPools("it", IT_POOLS);
  if (domain === "techhoy.com") return fetchPools("es", ES_POOLS);
  if (domain === "technikpost.de") {
    return fetchPools("de", DE_POOLS, (feed) => feed.filter((a) => !/google news/i.test(a.source)));
  }
  return fetchPools("en", EN_TECH_POOLS, (feed) => sliceForEnglishSite(feed, domain));
}

/**
 * The MediaStack feed a domain's pages are built from, or null when the domain
 * doesn't use MediaStack. The single source for the home and search pages, so
 * both make the identical requests (and share their fetch cache) instead of
 * drifting apart. legalhyper.com has its own feed, see fetchLegalHyperFeed.
 */
export async function fetchDomainMediaStackFeed(domain: string): Promise<MediaStackArticle[] | null> {
  if (isTechNewsDomain(domain)) return memoFeed(domain, () => fetchTechNewsFeed(domain));
  if (domain === "newsicons.com" || domain === "skyblueprime.com") {
    return memoFeed(domain, () => fetchPools("en", EN_TECH_POOLS, (feed) => sliceForEnglishSite(feed, domain)));
  }
  if (domain === "lavaguetech.com") return memoFeed(domain, () => fetchPools("fr", FR_POOLS));
  if (domain === "pressbig.com") {
    // Newest PRESSBIG_FEED_LIMIT stories only: the home page uses ~45 and the section pages page
    // through the rest, and every story kept costs an article-image scrape, so 470 -> 160 is the
    // difference between minutes and seconds on a cold build.
    return memoFeed(domain, () => fetchPools("en", PRESSBIG_POOLS, (feed) => feed.slice(0, PRESSBIG_FEED_LIMIT)));
  }
  return null;
}

/** legalhyper.com's feed: one pool per desk, so each desk has its own stories. */
export function fetchLegalHyperFeed(): Promise<MediaStackArticle[]> {
  return memoFeed("legalhyper.com", () => fetchPools("en", LEGALHYPER_POOLS));
}
