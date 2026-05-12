import { headers } from "next/headers";

export function cleanOgDescription(raw: string | null | undefined, maxLen = 160) {
  if (!raw) return "";

  let text = raw;

  // Remove base64 data URLs and long base64 blobs.
  text = text.replace(
    /data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/g,
    " "
  );
  text = text.replace(
    /base64,[A-Za-z0-9+/=]{20,}/g,
    " "
  );
  text = text.replace(
    /[A-Za-z0-9+/]{100,}={0,2}/g,
    " "
  );

  // Strip HTML tags.
  text = text.replace(/<[^>]*>/g, " ");

  // Strip fenced code blocks / inline code.
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]*`/g, " ");

  // Convert basic markdown to plain text.
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1"); // images -> alt text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // links -> link text

  // Remove common markdown tokens.
  text = text.replace(/^#{1,6}\s*/gm, "");
  text = text.replace(/^[>\-\*\+]\s+/gm, "");
  text = text.replace(/[*_~]/g, "");

  // Collapse whitespace and trim.
  text = text.replace(/\s+/g, " ").trim();

  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim();
}

export async function getRequestBaseUrl(domainFromParams: string) {
  let host = domainFromParams;
  let protocol = "https";

  try {
    const h = await headers();
    
    // Check if we are local
    const requestHost = h.get("host") || "";
    const isLocal =
      requestHost.includes("localhost") ||
      requestHost.includes("127.0.0.1") ||
      /:\d+$/.test(requestHost);

    if (isLocal) {
      protocol = "http";
      // If we're local, we might need the actual host (e.g. localhost:3000)
      if (requestHost) host = requestHost;
    } else {
      protocol = h.get("x-forwarded-proto") ?? "https";
      // In production, we trust the domainFromParams (e.g. 'voicejeju.com')
      // unless it's missing, then we check headers.
      if (!host) {
        host = h.get("x-forwarded-host") ?? h.get("host") ?? "newsicons.com";
      }
    }
  } catch (e) {
    // Fallback to domainFromParams and https for static generation
    if (!host) host = "newsicons.com";
  }

  return `${protocol}://${host}`;
}

export function toAbsoluteUrl(maybeUrl: string, baseUrl: string) {
  try {
    // If already absolute, this is a no-op.
    return new URL(maybeUrl).toString();
  } catch {
    // Relative or invalid absolute -> resolve against base.
    return new URL(maybeUrl.startsWith("/") ? maybeUrl : `/${maybeUrl}`, baseUrl).toString();
  }
}

export function buildOgImageUrl(inputUrl: string, baseUrl: string) {
  const absolute = toAbsoluteUrl(inputUrl, baseUrl);

  // Facebook can be picky about formats (notably WebP). Using Next's built-in
  // image optimizer makes the response content-type negotiation-friendly.
  const optimized = `${baseUrl}/_next/image?url=${encodeURIComponent(
    absolute
  )}&w=1200&q=75`;

  // Always prefer the optimized, same-origin URL for crawlers,
  // but keep the absolute original as a fallback.
  return { optimized, absolute };
}
