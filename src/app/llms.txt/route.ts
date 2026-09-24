import { articlesService } from "@/services/articles.service";
import { getSiteNameFromDomain, getSiteDescriptionFromDomain } from "@/lib/tenant";
import { cleanOgDescription } from "@/lib/metadata";
import { resolveSiteFromRequest } from "@/lib/siteRequest";

// Per-domain llms.txt (https://llmstxt.org) — a curated, plain-Markdown index
// of the site's most recent articles for LLMs that fetch it directly instead
// of (or alongside) crawling HTML. Domain resolved from the DB, not the raw
// Host, same as robots.ts / feed.xml.
export const dynamic = "force-dynamic";

export async function GET() {
  const { domain, baseUrl, tenantId, isLocal } = await resolveSiteFromRequest();

  // Unknown Host — don't emit a document branded with a domain we don't control.
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

  const byCategory = new Map<string, typeof articles>();
  for (const article of articles) {
    const key = article.category?.categoryName?.trim() || "Latest";
    const bucket = byCategory.get(key);
    if (bucket) bucket.push(article);
    else byCategory.set(key, [article]);
  }

  const sections = Array.from(byCategory.entries())
    .map(([category, items]) => {
      const lines = items
        .map((a) => {
          const slug = a.slug ?? a.id;
          const link = `${baseUrl}/article/${encodeURIComponent(slug)}`;
          const excerpt = cleanOgDescription(a.content ?? "", 200);
          const title = a.title?.trim() || "Untitled";
          return excerpt
            ? `- [${title}](${link}): ${excerpt}`
            : `- [${title}](${link})`;
        })
        .join("\n");
      return `## ${category}\n\n${lines}`;
    })
    .join("\n\n");

  const lastUpdated = articles.length
    ? new Date(Math.max(...articles.map((a) => dateOf(a).getTime()))).toISOString()
    : new Date().toISOString();

  const body = `# ${siteName}

> ${siteDesc}

Last updated: ${lastUpdated}

${sections || "No published articles yet."}

## Resources

- [Sitemap](${baseUrl}/sitemap.xml)
- [News sitemap](${baseUrl}/news-sitemap.xml)
- [RSS feed](${baseUrl}/feed.xml)
`;

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control":
        "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
