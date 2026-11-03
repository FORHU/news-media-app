import { getSiteNameFromDomain, getSiteDescriptionFromDomain } from "@/lib/tenant";
import { resolveSiteFromRequest } from "@/lib/siteRequest";

// A2A Agent Card (https://a2a-protocol.org/latest/topics/agent-discovery/).
// This is a read-only news publisher: the card advertises discovery surfaces
// (markdown pages, RSS, llms.txt) over plain HTTP, not a live JSON-RPC agent.
export const dynamic = "force-dynamic";

export async function GET() {
  const { domain, baseUrl, tenantId, isLocal } = await resolveSiteFromRequest();

  if (!tenantId && !isLocal) {
    return new Response("Not found", { status: 404 });
  }

  const siteName = getSiteNameFromDomain(domain);
  const siteDesc = getSiteDescriptionFromDomain(domain);

  const card = {
    name: siteName,
    description: siteDesc || `${siteName} is a news publication. Agents can read its articles as Markdown, RSS or llms.txt.`,
    version: "1.0.0",
    supportedInterfaces: [
      { url: baseUrl, protocolBinding: "HTTP+JSON", protocolVersion: "0.3" },
    ],
    url: baseUrl,
    protocolVersion: "0.3.0",
    preferredTransport: "HTTP+JSON",
    provider: { organization: siteName, url: baseUrl },
    documentationUrl: `${baseUrl}/llms.txt`,
    capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/markdown", "text/html", "application/rss+xml"],
    skills: [
      {
        id: "read-articles-markdown",
        name: "Read articles as Markdown",
        description: `Fetch any ${siteName} page with "Accept: text/markdown" to receive a clean Markdown version instead of HTML.`,
        tags: ["news", "markdown", "content"],
        examples: [`GET ${baseUrl}/ with Accept: text/markdown`],
        inputModes: ["text/plain"],
        outputModes: ["text/markdown"],
      },
      {
        id: "latest-news-feed",
        name: "Latest news feed",
        description: `Subscribe to the latest published ${siteName} articles via RSS.`,
        tags: ["news", "rss", "feed"],
        examples: [`GET ${baseUrl}/feed.xml`],
        inputModes: ["text/plain"],
        outputModes: ["application/rss+xml"],
      },
      {
        id: "site-index-llms",
        name: "LLM-friendly site index",
        description: `A curated Markdown index of recent ${siteName} articles grouped by category.`,
        tags: ["news", "llms.txt", "index"],
        examples: [`GET ${baseUrl}/llms.txt`],
        inputModes: ["text/plain"],
        outputModes: ["text/markdown"],
      },
    ],
  };

  return new Response(JSON.stringify(card, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
