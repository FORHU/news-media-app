import { headers } from "next/headers";
import { articlesService } from "@/services/articles.service";
import {
  normalizeHostToDomain,
  resolveTenantIdFromDomain,
  getSiteNameFromDomain,
} from "@/lib/tenant";

// Google News sitemap — only articles from the last 48h, per Google's spec.
// Host-driven like sitemap.ts / robots.ts. Submit as a separate sitemap in GSC.
export const dynamic = "force-dynamic";

const NEWS_WINDOW_MS = 1000 * 60 * 60 * 48;

const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  const headersList = await headers();
  const host = headersList.get("host") || "newsicons.com";
  const domain = normalizeHostToDomain(host) || "newsicons.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const publicationName = getSiteNameFromDomain(domain);

  const tenantId = await resolveTenantIdFromDomain(domain);
  const articles = tenantId
    ? await articlesService.getArticles({ limit: 200, status: "published" }, tenantId)
    : [];

  const now = Date.now();
  const recent = articles.filter((a) => {
    const t = new Date(a.publishDate ?? a.createdAt ?? 0).getTime();
    return Number.isFinite(t) && now - t <= NEWS_WINDOW_MS;
  });

  const urls = recent
    .map((a) => {
      const slug = a.slug ?? a.id;
      const loc = `${baseUrl}/article/${encodeURIComponent(slug)}`;
      const pubDate = new Date(a.publishDate ?? a.createdAt ?? now).toISOString();
      return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(publicationName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${xmlEscape(a.title ?? "Untitled")}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control":
        "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
