import { articlesService } from "@/services/articles.service";
import {
  getSiteNameFromDomain,
  getSiteDescriptionFromDomain,
} from "@/lib/tenant";
import { cleanOgDescription } from "@/lib/metadata";
import { resolveSiteFromRequest } from "@/lib/siteRequest";

// Per-domain RSS 2.0 feed. Domain resolved from the DB, not the raw Host.
export const dynamic = "force-dynamic";

const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  const { domain, baseUrl, tenantId, isLocal } = await resolveSiteFromRequest();

  // Unknown Host — don't emit a feed branded with a domain we don't control.
  if (!tenantId && !isLocal) {
    return new Response("Not found", { status: 404 });
  }

  const siteName = getSiteNameFromDomain(domain);
  const siteDesc = getSiteDescriptionFromDomain(domain);

  const articles = tenantId
    ? await articlesService.getArticles({ limit: 50, status: "published" }, tenantId)
    : [];

  const dateOf = (a: (typeof articles)[number]) =>
    new Date(a.publishDate ?? a.createdAt ?? Date.now());

  const items = articles
    .map((a) => {
      const slug = a.slug ?? a.id;
      const link = `${baseUrl}/article/${encodeURIComponent(slug)}`;
      const category = a.category?.categoryName;
      return `    <item>
      <title>${xmlEscape(a.title ?? "Untitled")}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${dateOf(a).toUTCString()}</pubDate>${
        category ? `\n      <category>${xmlEscape(category)}</category>` : ""
      }
      <description><![CDATA[${cleanOgDescription(a.content ?? "", 500).replace(/]]>/g, "]]&gt;")}]]></description>
    </item>`;
    })
    .join("\n");

  const lastBuild = articles.length
    ? new Date(Math.max(...articles.map((a) => dateOf(a).getTime()))).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(siteName)}</title>
    <link>${xmlEscape(baseUrl)}</link>
    <description>${xmlEscape(siteDesc)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${xmlEscape(`${baseUrl}/feed.xml`)}" rel="self" type="application/rss+xml"/>
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control":
        "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
