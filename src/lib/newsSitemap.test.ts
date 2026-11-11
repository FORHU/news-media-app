import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNewsSitemapXml, recentArticles } from "./newsSitemap";

const base = { baseUrl: "https://example.com", publicationName: "Example", language: "en" };
const NOW = Date.parse("2026-11-11T00:00:00Z");

test("empty window yields a valid, empty urlset in the news namespace", () => {
  const xml = buildNewsSitemapXml({ ...base, articles: [], now: NOW });
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  assert.match(xml, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
  assert.ok(!xml.includes("<url>"));
  assert.ok(xml.trimEnd().endsWith("</urlset>"));
});

test("old articles are excluded, recent ones listed with escaped fields", () => {
  const xml = buildNewsSitemapXml({
    ...base,
    now: NOW,
    articles: [
      { id: "1", slug: "2026-11-10-a&b", title: "A & B <x>", publishDate: "2026-11-10T08:00:00Z" },
      { id: "2", slug: "old", title: "Old", publishDate: "2026-11-01T08:00:00Z" },
    ],
  });
  assert.equal((xml.match(/<url>/g) ?? []).length, 1);
  assert.match(xml, /<loc>https:\/\/example\.com\/article\/2026-11-10-a%26b<\/loc>/);
  assert.match(xml, /A &amp; B &lt;x&gt;/);
});

test("articles with missing or future dates are ignored", () => {
  const kept = recentArticles(
    [
      { id: "a" },
      { id: "b", publishDate: "2030-01-01T00:00:00Z" },
      { id: "c", publishDate: "2026-11-10T12:00:00Z" },
    ],
    NOW
  );
  assert.deepEqual(kept.map((a) => a.id), ["c"]);
});
