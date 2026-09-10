import type { Article } from "@/lib/types";
import {
  getSiteNameFromDomain,
  getSiteLogoFromDomain,
  getSiteDescriptionFromDomain,
  getSiteSameAsFromDomain,
} from "@/lib/tenant-utils";

/**
 * schema.org structured data (JSON-LD) builders.
 *
 * Pure functions — a domain string plus data the caller already has in hand
 * go in, a plain object comes out. No DB access, no `headers()`. The result is
 * handed to <JsonLd> for rendering.
 *
 * Every field is derived from either the domain (via the client-safe
 * tenant-utils helpers) or an already-fetched Article row, so adding these
 * needs no schema change. We have no per-article byline data, so `author`
 * is set to the publishing Organisation itself — a pattern Google allows.
 */

type Json = Record<string, unknown>;

const stripTrailingSlash = (url: string): string =>
  url.endsWith("/") ? url.slice(0, -1) : url;

/** ISO-8601 string for a valid date input, or null — never throws. */
function toIsoOrNull(value: Date | string | number | null | undefined): string | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Production base URL for a tenant domain, derived purely from the route param
 * so callers stay statically renderable (no `headers()` / dynamic opt-in).
 * In production `getRequestBaseUrl()` resolves to this same value; the two only
 * diverge on localhost, where JSON-LD accuracy does not matter.
 */
export function baseUrlForDomain(domain: string | null | undefined): string {
  const d = (domain ?? "").trim().toLowerCase();
  if (!d) return "https://newsicons.com";
  const isLocal =
    d.includes("localhost") || d.startsWith("127.0.0.1") || /:\d+$/.test(d);
  return `${isLocal ? "http" : "https"}://${d}`;
}

/** Absolute URL to the site's logo file under /public/Logo. */
export function siteLogoUrl(domain: string, baseUrl: string): string {
  return `${stripTrailingSlash(baseUrl)}/Logo/${getSiteLogoFromDomain(domain)}`;
}

/** The publisher/author block, embedded inside NewsArticle and WebSite. */
function organisationRef(domain: string, baseUrl: string): Json {
  return {
    "@type": "Organization",
    name: getSiteNameFromDomain(domain),
    url: `${stripTrailingSlash(baseUrl)}/`,
    logo: {
      "@type": "ImageObject",
      url: siteLogoUrl(domain, baseUrl),
    },
  };
}

/**
 * Standalone Organization entity for the site. Rendered once, site-wide, from
 * the (sites) layout so it appears on every page including the landing page.
 */
export function buildOrganizationLd(domain: string, baseUrl: string): Json {
  const base = stripTrailingSlash(baseUrl);
  const sameAs = getSiteSameAsFromDomain(domain);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: getSiteNameFromDomain(domain),
    url: `${base}/`,
    description: getSiteDescriptionFromDomain(domain),
    logo: {
      "@type": "ImageObject",
      url: siteLogoUrl(domain, baseUrl),
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/**
 * WebSite entity — ties the domain to the brand and advertises the on-site
 * search endpoint (?search=) so Google can offer a sitelinks search box.
 */
export function buildWebSiteLd(domain: string, baseUrl: string): Json {
  const base = stripTrailingSlash(baseUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: getSiteNameFromDomain(domain),
    url: `${base}/`,
    description: getSiteDescriptionFromDomain(domain),
    publisher: { "@id": `${base}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/search?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** NewsArticle entity for a single story. */
export function buildNewsArticleLd(params: {
  domain: string;
  baseUrl: string;
  article: Pick<Article, "title" | "publishDate" | "createdAt" | "category">;
  /** Pre-cleaned summary — pass the cleanOgDescription() result. */
  description: string;
  /** Absolute canonical URL of the article page. */
  canonicalUrl: string;
  /** Absolute, de-duplicated image URLs (may be empty). */
  imageUrls: string[];
}): Json {
  const { domain, baseUrl, article, description, canonicalUrl, imageUrls } =
    params;
  const base = stripTrailingSlash(baseUrl);
  const siteName = getSiteNameFromDomain(domain);

  const publishedIso = toIsoOrNull(article.publishDate ?? article.createdAt);

  const ld: Json = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    // Google truncates headlines past ~110 chars and flags longer ones.
    headline: (article.title?.trim() || siteName).slice(0, 110),
    description,
    url: canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    // No byline data in the DB — attribute to the publication itself.
    author: organisationRef(domain, baseUrl),
    publisher: organisationRef(domain, baseUrl),
    isPartOf: { "@id": `${base}/#website` },
  };

  if (publishedIso) {
    ld.datePublished = publishedIso;
    // `dateModified` intentionally omitted: ContentArticle.updatedAt is bumped
    // by unrelated writes (e.g. view-count increments), so echoing it would
    // report every article as "modified today" — a false freshness signal.
    // Google falls back to datePublished when dateModified is absent.
  }

  if (imageUrls.length > 0) ld.image = imageUrls;

  const section = article.category?.categoryName?.trim();
  if (section) ld.articleSection = section;

  return ld;
}

/** Breadcrumb trail for an article page: Home › [Section] › Headline. */
export function buildBreadcrumbLd(params: {
  domain: string;
  baseUrl: string;
  headline: string;
  canonicalUrl: string;
  section?: string | null;
}): Json {
  const { domain, baseUrl, headline, canonicalUrl, section } = params;
  const base = stripTrailingSlash(baseUrl);

  const items: Json[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: getSiteNameFromDomain(domain),
      item: `${base}/`,
    },
  ];

  const trimmedSection = section?.trim();
  if (trimmedSection) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: trimmedSection,
      item: `${base}/search?category=${encodeURIComponent(trimmedSection)}`,
    });
  }

  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: headline,
    item: canonicalUrl,
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}
