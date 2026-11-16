"use client";

import { useEffect, useState } from "react";
import { FacetLink } from "@/components/FacetLink";
import { normalizeCategoryKey } from "@/config/categories";
import type { MediaStackArticle } from "@/lib/mediastack";
import { toFeedRows } from "../technews-shared/feed";
import { Scrap } from "./paper";
import { PB_SECTIONS, sectionHref } from "./edit";
import { PressBigAdStrip } from "./PressBigAds";
import "./pressbig.css";

/** 15 is a whole number of wall blocks at 3 columns (blocks of 3) and 4 columns (blocks of 5). */
const PAGE = 15;

/** The wall's column count, mirroring the CSS breakpoints (640 / 900 / 1280). Null until measured. */
function useColumns(): number | null {
  const [cols, setCols] = useState<number | null>(null);
  useEffect(() => {
    const read = () => {
      const w = window.innerWidth;
      setCols(w >= 1280 ? 4 : w >= 900 ? 3 : w >= 640 ? 2 : 1);
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);
  return cols;
}

/**
 * How many of n stories to show so the wall ends on a whole block instead of a half-empty
 * row: a multiple of 3 or 5 stories at three or four columns, an odd count at two (the lead
 * takes a row, the rest pair up). With too few stories for one block, show them all.
 */
function tidyCount(n: number, cols: number | null): number {
  if (!cols || cols === 1) return n;
  if (cols === 2) return n > 1 && n % 2 === 0 ? n - 1 : n;
  const block = cols === 3 ? 3 : 5;
  const whole = n - (n % block);
  return whole > 0 ? whole : n;
}

/**
 * Search and section pages for pressbig.com: PressBig's own articles blended
 * with the matching wire stories, newest first, as a wall of scraps. The six
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
  const cols = useColumns();
  const visible = rows.slice(0, tidyCount(Math.min(shown, rows.length), cols));
  const heading = categoryName ?? (searchQuery ? `“${searchQuery}”` : "Every story");
  const activeKey = categoryName ? normalizeCategoryKey(categoryName) : "";
  const tone = PB_SECTIONS.find((s) => normalizeCategoryKey(s.name) === activeKey)?.tone;

  return (
    <div className="pb pb-page">
      <div className="pb-page__inner">
        <div className={`pb-results__head pb-paper ${tone ? `pb-paper--${tone}` : "pb-paper--black"}`}>
          <h1 className="pb-display pb-results__title">{heading}</h1>
          <p className="pb-results__count">Newest first</p>
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
            <ul className={`pb-results__grid${visible.length <= 4 ? " pb-results__grid--few" : ""}`} style={tone ? ({ ["--tint" as string]: `var(--pb-${tone})` } as React.CSSProperties) : undefined}>
              {visible.map((row) => (
                <li key={row.id}>
                  <Scrap row={row} showDescription />
                </li>
              ))}
            </ul>
            <PressBigAdStrip tilt="left" />
            {shown < rows.length && (
              <div style={{ marginTop: "0.5rem" }}>
                <button type="button" className="pb-strip pb-paper pb-strip--black" onClick={() => setShown((n) => n + PAGE)}>
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
