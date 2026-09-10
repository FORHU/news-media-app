import { env } from "@/lib/env";

/**
 * Fire-and-forget notifications to external indexers when content changes.
 *
 *  - IndexNow (https://www.indexnow.org): push changed URLs to Bing, Yandex,
 *    Seznam, etc. Google does NOT participate, but Bing's index feeds Copilot
 *    and ChatGPT search. Needs INDEXNOW_KEY set + /indexnow-key.txt reachable.
 *  - WebSub / PubSubHubbub: tell the public hub that a domain's RSS feed
 *    changed. Legacy but still honoured by some aggregators; costs nothing.
 *
 * Everything here swallows its own errors. Callers should invoke
 * `notifySearchEngines(...)` without awaiting from inside a publish handler.
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const WEBSUB_HUB = "https://pubsubhubbub.appspot.com/";
const REQUEST_TIMEOUT_MS = 4000;
const INDEXNOW_MAX_URLS = 10_000;

const isProd = process.env.NODE_ENV === "production";

/** Bare, lowercased, www-stripped host — or null for localhost / non-hosts. */
function normalizeHost(input: string): string | null {
  const d = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!d || d.includes("localhost") || d.startsWith("127.") || /:\d+$/.test(d)) {
    return null;
  }
  return d.startsWith("www.") ? d.slice(4) : d;
}

async function postWithTimeout(
  url: string,
  init: RequestInit
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    console.warn(
      `[searchPing] ${url} failed:`,
      err instanceof Error ? err.message : err
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Submit changed URLs for a single host to IndexNow. */
export async function submitToIndexNow(
  domain: string,
  urls: string[]
): Promise<void> {
  const host = normalizeHost(domain);
  const key = env.INDEXNOW_KEY;
  if (!isProd || !host || !key) return;

  const urlList = Array.from(new Set(urls.filter(Boolean))).slice(
    0,
    INDEXNOW_MAX_URLS
  );
  if (urlList.length === 0) return;

  const res = await postWithTimeout(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `https://${host}/indexnow-key.txt`,
      urlList,
    }),
  });
  if (res) {
    console.log(
      `[searchPing] IndexNow ${host}: ${res.status} (${urlList.length} url${
        urlList.length === 1 ? "" : "s"
      })`
    );
  }
}

/** Tell the WebSub hub that a domain's RSS feed changed. */
export async function pingWebSub(domain: string): Promise<void> {
  const host = normalizeHost(domain);
  if (!isProd || !host) return;

  const feedUrl = `https://${host}/feed.xml`;
  const res = await postWithTimeout(WEBSUB_HUB, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      "hub.mode": "publish",
      "hub.url": feedUrl,
    }).toString(),
  });
  if (res) {
    console.log(`[searchPing] WebSub ${feedUrl}: ${res.status}`);
  }
}

/**
 * Notify indexers that content changed on one or more domains. Groups URLs by
 * host, then pings IndexNow (with the URLs) and WebSub (with the feed) once per
 * host. Never throws; safe to call without `await`.
 */
export function notifySearchEngines(
  entries: Array<{ domain: string; urls: string[] }>
): void {
  if (!isProd || entries.length === 0) return;

  const byHost = new Map<string, Set<string>>();
  for (const { domain, urls } of entries) {
    const host = normalizeHost(domain);
    if (!host) continue;
    const set = byHost.get(host) ?? new Set<string>();
    for (const u of urls) if (u) set.add(u);
    byHost.set(host, set);
  }

  for (const [host, urlSet] of byHost) {
    void submitToIndexNow(host, [...urlSet]);
    void pingWebSub(host);
  }
}

/** Convenience: absolute URLs to ping for a freshly published article. */
export function articlePingUrls(domain: string, slugOrId: string): string[] {
  const host = normalizeHost(domain);
  if (!host) return [];
  return [
    `https://${host}/article/${encodeURIComponent(slugOrId)}`,
    `https://${host}/`,
  ];
}
