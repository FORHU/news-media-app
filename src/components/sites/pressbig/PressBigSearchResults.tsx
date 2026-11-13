"use client";

import { useState } from "react";
import { FacetLink } from "@/components/FacetLink";
import { normalizeCategoryKey } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";
import { toFeedRows } from "../technews-shared/feed";
import { Scrap } from "./paper";
import { PB_SECTIONS, sectionHref } from "./edit";
import "./pressbig.css";

const PAGE = 12;

/**
 * Search and section pages for pressbig.com: PressBig's own articles blended
 * with the matching wire stories, newest first, as a wall of scraps. The four
 * section strips are the same facets as the header nav.
 */
export function PressBigSearchResults({
  domain,
  articles,
  mediastackArticles,
  searchQuery,
  categoryName,
}: {
  domain: string;
  articles: Parameters<typeof toFeedRows>[0];
  mediastackArticles: MediaStackArticle[];
  searchQuery?: string;
  categoryName?: string | null;
}) {
  const [shown, setShown] = useState(PAGE);
  const rows = toFeedRows(articles, mediastackArticles, { domain });
  const visible = rows.slice(0, shown);
  const heading = categoryName ?? (searchQuery ? `“${searchQuery}”` : "Every story");
  const activeKey = categoryName ? normalizeCategoryKey(categoryName) : "";
  const tone = PB_SECTIONS.find((s) => normalizeCategoryKey(s.name) === activeKey)?.tone;

  return (
    <div className="pb pb-page">
      <div className="pb-page__inner">
        <div className={`pb-results__head pb-paper ${tone ? `pb-paper--${tone}` : "pb-paper--black"}`}>
          <h1 className="pb-display pb-results__title">{heading}</h1>
          <p className="pb-results__count">
            {rows.length} {rows.length === 1 ? "story" : "stories"}
          </p>
        </div>

        <nav className="pb-filters" aria-label="Filter by section">
          <FacetLink href="/search" className="pb-strip pb-paper pb-strip--ghost" aria-current={!activeKey ? "true" : undefined}>
            All
          </FacetLink>
          {PB_SECTIONS.map((s) => (
            <FacetLink
              key={s.name}
              href={sectionHref(s.name)}
              className="pb-strip pb-paper pb-strip--ghost"
              aria-current={normalizeCategoryKey(s.name) === activeKey ? "true" : undefined}
            >
              {s.name}
            </FacetLink>
          ))}
        </nav>

        {rows.length === 0 ? (
          <div className="pb-empty pb-paper">
            <h2 className="pb-display">Nothing pasted up here.</h2>
            <p>No stories match that. Try another word, or head back to today&apos;s edit.</p>
            <FacetLink href="/search" className="pb-strip pb-paper">
              Browse every story
            </FacetLink>
          </div>
        ) : (
          <>
            <ul className="pb-results__grid" style={tone ? ({ ["--tint" as string]: `var(--pb-${tone})` } as React.CSSProperties) : undefined}>
              {visible.map((row) => (
                <li key={row.id}>
                  <Scrap row={row} showDescription />
                </li>
              ))}
            </ul>
            {shown < rows.length && (
              <div style={{ marginTop: "2.5rem" }}>
                <button type="button" className="pb-strip pb-paper pb-strip--black" onClick={() => setShown((n) => n + PAGE)}>
                  Show {Math.min(PAGE, rows.length - shown)} more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
