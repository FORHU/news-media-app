"use client"; // LegalHyper search/category results — filters the static mock set client-side

import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";
import { TENANT_CATEGORIES } from "@/config/categories";
import { LEGALHYPER_MOCK_ARTICLES } from "./mockArticles";
import type { MockArticle } from "./mockArticles";

const INK = "#0E1A2F";
const GOLD = "#8A6A22";
const BRASS = "#B08D3F";
const PARCHMENT = "#F4F0E6";
const RULE = "#DCD5C2";

function articleHref(article: MockArticle) {
  return `/article/${article.slug || article.id}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function readingMinutes(content?: string | null) {
  const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function LegalHyperSearch({
  searchQuery,
  categoryParam,
}: {
  searchQuery?: string;
  categoryParam?: string;
}) {
  const categories = TENANT_CATEGORIES["legalhyper.com"] ?? [];
  const activeCategory = categoryParam ? decodeURIComponent(categoryParam) : null;

  const results = LEGALHYPER_MOCK_ARTICLES.filter((a) => {
    if (activeCategory && a.category?.categoryName !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const haystack = `${a.title} ${a.content ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const trending = [...LEGALHYPER_MOCK_ARTICLES]
    .sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0))
    .slice(0, 5);

  const heading = activeCategory ?? (searchQuery ? `“${searchQuery}”` : "All Stories");

  return (
    <div className="font-chivo" style={{ background: PARCHMENT, color: "#1A1A16", minHeight: "60vh" }}>
      <main className="max-w-[1340px] mx-auto px-4 sm:px-7 pt-10 pb-20">
        <div className="pb-5" style={{ borderBottom: `1px solid ${INK}` }}>
          <div className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: GOLD }}>
            {searchQuery ? "Search Results" : "Browse"}
          </div>
          <div className="flex items-baseline justify-between gap-5 mt-2 flex-wrap">
            <h1 className="font-bodoni font-medium uppercase m-0" style={{ fontSize: "clamp(28px,3.6vw,44px)", lineHeight: 1.1, color: INK }}>
              {heading}
            </h1>
            <span className="text-[11px] uppercase shrink-0" style={{ letterSpacing: "0.14em", color: "#7A7466" }}>
              {results.length} {results.length === 1 ? "story" : "stories"}
            </span>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mt-6 pb-6" style={{ borderBottom: `1px solid ${RULE}` }}>
          <Link
            href="/search"
            className="px-3.5 py-1.5 text-[10.5px] uppercase transition-colors"
            style={{
              letterSpacing: "0.14em",
              border: `1px solid ${!activeCategory ? INK : "#CBC4B1"}`,
              background: !activeCategory ? INK : "transparent",
              color: !activeCategory ? PARCHMENT : "#3B3B33",
            }}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/search?category=${encodeURIComponent(cat)}`}
              className="px-3.5 py-1.5 text-[10.5px] uppercase transition-colors"
              style={{
                letterSpacing: "0.14em",
                border: `1px solid ${activeCategory === cat ? INK : "#CBC4B1"}`,
                background: activeCategory === cat ? INK : "transparent",
                color: activeCategory === cat ? PARCHMENT : "#3B3B33",
              }}
            >
              {cat}
            </Link>
          ))}
          {(activeCategory || searchQuery) && (
            <Link
              href="/search"
              className="px-3.5 py-1.5 text-[10.5px] uppercase"
              style={{ letterSpacing: "0.14em", color: BRASS }}
            >
              Clear ×
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-11 mt-8">
          <div className="flex-1 min-w-0" style={{ flexBasis: 620 }}>
            {results.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-garamond text-xl" style={{ color: INK }}>No stories match this filter.</p>
                <Link href="/search" className="inline-block mt-4 text-[11px] uppercase" style={{ color: GOLD, letterSpacing: "0.18em" }}>
                  ← Clear filters
                </Link>
              </div>
            ) : (
              results.map((article) => (
                <article key={article.id} className="flex flex-wrap gap-6.5 py-7" style={{ borderBottom: `1px solid ${RULE}`, gap: 26 }}>
                  <Link href={articleHref(article)} className="shrink-0" style={{ flexBasis: 220, maxWidth: "100%" }}>
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#E3DECF]">
                      <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="220px" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0" style={{ flexBasis: 280 }}>
                    <span className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.24em", color: GOLD }}>
                      {article.category?.categoryName}
                    </span>
                    <Link href={articleHref(article)}>
                      <h3 className="font-garamond font-semibold mt-2.5 mb-0" style={{ fontSize: 24, lineHeight: 1.2, color: INK }}>
                        {article.title}
                      </h3>
                    </Link>
                    {article.content && (
                      <p className="text-[15px] leading-[1.6] mt-2.5" style={{ color: "#4E4E45" }}>
                        {article.content}
                      </p>
                    )}
                    <div className="mt-3 text-[10.5px] uppercase" style={{ letterSpacing: "0.12em", color: "#7A7466" }}>
                      {article.author} · {formatDate(article.createdAt)} · {readingMinutes(article.content)} min read
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <aside className="flex-1 min-w-0" style={{ flexBasis: 290 }}>
            <div className="pb-4" style={{ borderBottom: `1px solid ${INK}` }}>
              <h2 className="font-garamond font-semibold m-0" style={{ fontSize: 24, color: INK, letterSpacing: "0.02em" }}>
                Trending Stories
              </h2>
            </div>
            {trending.map((article, i) => (
              <div key={article.id} className="flex gap-4.5 py-5" style={{ borderBottom: `1px solid ${RULE}`, gap: 18 }}>
                <div className="font-bodoni shrink-0" style={{ fontSize: 32, lineHeight: 0.9, color: "#C3BCA7" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <Link href={articleHref(article)} className="font-garamond" style={{ fontSize: 17, lineHeight: 1.3, color: INK }}>
                  {article.title}
                </Link>
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
