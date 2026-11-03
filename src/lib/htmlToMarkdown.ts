import TurndownService from "turndown";

const REMOVED_TAGS = ["script", "style", "noscript", "iframe", "svg", "nav", "footer", "form", "button", "template"] as const;

function createService(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
  });
  td.remove((node) => (REMOVED_TAGS as readonly string[]).includes(node.nodeName.toLowerCase()));
  return td;
}

/** True when the Accept header prefers text/markdown over text/html. */
export function acceptsMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  let mdQ = -1;
  let htmlQ = -1;
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().toLowerCase().split(";");
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
    if (Number.isNaN(q)) continue;
    if (type === "text/markdown") mdQ = Math.max(mdQ, q);
    else if (type === "text/html") htmlQ = Math.max(htmlQ, q);
  }
  return mdQ > 0 && mdQ >= htmlQ;
}

export function htmlToMarkdown(html: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim();
  const mainHtml =
    html.match(/<main[\s\S]*?<\/main>/i)?.[0] ??
    html.match(/<body[\s\S]*?<\/body>/i)?.[0] ??
    html;
  const body = createService().turndown(mainHtml).replace(/\n{3,}/g, "\n\n").trim();
  return title && !/^#\s/.test(body) ? `# ${title}\n\n${body}\n` : `${body}\n`;
}

/** Rough token estimate (~4 chars per token) for the x-markdown-tokens header. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
