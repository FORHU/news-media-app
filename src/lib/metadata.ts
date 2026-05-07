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

export async function getRequestBaseUrl(fallbackDomain: string) {
  let host = fallbackDomain;
  let protocol = "https";

  // In Next.js, calling headers() during static generation triggers a 
  // "Dynamic Server Usage" error. We wrap this to avoid breaking the build.
  try {
    const h = await headers();
    const requestHost = h.get("x-forwarded-host") ?? h.get("host");
    if (requestHost) {
      host = requestHost;
    }
    const protoHeader = h.get("x-forwarded-proto");
    const isLocal =
      host.includes("localhost") ||
      host.includes("127.0.0.1") ||
      /:\d+$/.test(host);
    protocol = protoHeader ?? (isLocal ? "http" : "https");
  } catch (e) {
    // During static generation (SSG/ISR build), headers() will throw.
    // We catch it here and use the fallbackDomain (e.g. 'jejutime.com')
    // which ensures the build succeeds while still providing a valid URL.
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
