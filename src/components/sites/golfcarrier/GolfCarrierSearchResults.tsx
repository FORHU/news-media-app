"use client";

import { useState } from "react";
import { FacetLink } from "@/components/FacetLink";
import { normalizeCategoryKey } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";
import { toFeedRows } from "../technews-shared/feed";
import { StoryCard, cleanRows } from "./parts";
import { GC_SECTIONS, holeNumber, sectionHref } from "./edit";
import "./golfcarrier.css";

const PAGE = 12;

/**
 * Search and section pages for golfcarrier.com: GolfCarrier's own articles
 * blended with the matching wire stories, newest first. The chips are the same
 * section facets as the header nav.
 */
export function GolfCarrierSearchResults({
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
  const rows = cleanRows(toFeedRows(articles, mediastackArticles, { domain }));
  const visible = rows.slice(0, shown);
  const activeKey = categoryName ? normalizeCategoryKey(categoryName) : "";
  const sectionIndex = GC_SECTIONS.findIndex((s) => normalizeCategoryKey(s) === activeKey);

  const kicker = sectionIndex >= 0 ? `Hole ${holeNumber(sectionIndex)}` : searchQuery ? "Search" : "All stories";
  const heading =
    sectionIndex >= 0 ? GC_SECTIONS[sectionIndex] : categoryName ?? (searchQuery ? `“${searchQuery}”` : "Every story");

  return (
    <div className="gc">
      <header className="gc-pagehead gc-on-dark">
        <div className="gc-wrap">
          <span className="gc-kicker">{kicker}</span>
          <h1>{heading}</h1>
          <p>
            {rows.length} {rows.length === 1 ? "story" : "stories"}
          </p>
        </div>
      </header>

      <div className="gc-wrap gc-results">
        <nav className="gc-filters" aria-label="Filter by section">
          <FacetLink href="/search" className="gc-chip" aria-current={!activeKey ? "true" : undefined}>
            All
          </FacetLink>
          {GC_SECTIONS.map((name) => (
            <FacetLink
              key={name}
              href={sectionHref(name)}
              className="gc-chip"
              aria-current={normalizeCategoryKey(name) === activeKey ? "true" : undefined}
            >
              {name}
            </FacetLink>
          ))}
        </nav>

        {rows.length === 0 ? (
          <div className="gc-empty">
            <h2>Nothing on the card.</h2>
            <p>No stories match that yet. Try another search, or see the latest from every tour.</p>
            <FacetLink href="/search" className="gc-btn">
              See every story
            </FacetLink>
          </div>
        ) : (
          <>
            <ul className="gc-results__grid">
              {visible.map((row) => (
                <li key={row.id}>
                  <StoryCard row={row} showDescription />
                </li>
              ))}
            </ul>
            {shown < rows.length && (
              <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
                <button type="button" className="gc-btn gc-btn--ghost" onClick={() => setShown((n) => n + PAGE)}>
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
