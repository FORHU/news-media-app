import { articlesService } from "@/services/articles.service";
import { getSiteNameFromDomain, getSiteLanguageFromDomain } from "@/lib/tenant";
import { resolveSiteFromRequest } from "@/lib/siteRequest";
import { buildNewsSitemapXml } from "@/lib/newsSitemap";

// Google News sitemap — only articles from the last 48h, per Google's spec.
// Domain resolved from the DB, not the raw Host. Submit separately in GSC.
//
// This route NEVER 404s. With nothing inside the 48h window (or an unknown
// Host, or a DB hiccup) it returns HTTP 200 with a valid, empty <urlset>, so
// robots.txt can keep advertising the URL without Search Console flagging it
// as unfetchable.
export const dynamic = "force-dynamic";

const XML_HEADERS = {
  "content-type": "application/xml; charset=utf-8",
  "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
};

export async function GET() {
  const { domain, baseUrl, tenantId } = await resolveSiteFromRequest();

  const publicationName = getSiteNameFromDomain(domain);
  const language = getSiteLanguageFromDomain(domain);

  let articles: Awaited<ReturnType<typeof articlesService.getArticles>> = [];
  if (tenantId) {
    try {
      articles = await articlesService.getArticles({ limit: 200, status: "published" }, tenantId);
    } catch (error) {
      console.error("[news-sitemap] article query failed, serving empty urlset:", error);
    }
  }

  return new Response(
    buildNewsSitemapXml({ baseUrl, publicationName, language, articles }),
    { status: 200, headers: XML_HEADERS }
  );
}
