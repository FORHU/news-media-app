import { getCoreCategories, normalizeCategoryKey } from "@/config/categories";
import type { FeedRow } from "../technews-shared/feed";

export const GC_DOMAIN = "golfcarrier.com";

/** GolfCarrier's sections, in nav order (the source of truth is TENANT_CATEGORIES). */
export const GC_SECTIONS: readonly string[] = getCoreCategories(GC_DOMAIN);

export function sectionHref(name: string): string {
  return `/search?category=${encodeURIComponent(name)}`;
}

export function sectionId(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** "01".."07": the section's hole number on the scorecard. */
export function holeNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function sectionOf(row: FeedRow): string | null {
  const key = normalizeCategoryKey(row.category?.categoryName);
  return GC_SECTIONS.find((s) => normalizeCategoryKey(s) === key) ?? null;
}

export interface GolfSection {
  name: string;
  id: string;
  hole: string;
  /** Every story in the feed for this section (for the scorecard count). */
  total: number;
  /** Stories shown in this section's block on the home page. */
  picks: FeedRow[];
}

export interface GolfEdit {
  lead: FeedRow | null;
  /** The leaderboard: the newest stories after the lead. */
  board: FeedRow[];
  sections: GolfSection[];
  /** Stories not placed above, for the closing list. */
  leftover: FeedRow[];
}

const BOARD = 6;
const PER_SECTION = 5;
const LEFTOVER = 9;

/**
 * Lays out the home page from the blended feed (newest first, with an editor's
 * headline pin or trending score floating a row up). Every story is placed
 * once. The lead must have a picture; the leaderboard is text-only, so it can
 * take any story; section cards fall back to a striped placeholder.
 */
export function buildGolfEdit(rows: FeedRow[]): GolfEdit {
  const used = new Set<string>();
  const take = (r: FeedRow) => {
    used.add(r.id);
    return r;
  };

  const leadRow = rows.find((r) => r.imageUrl) ?? rows[0] ?? null;
  const lead = leadRow ? take(leadRow) : null;
  const board = rows.filter((r) => !used.has(r.id)).slice(0, BOARD).map(take);

  const sections = GC_SECTIONS.map((name, i) => {
    const key = normalizeCategoryKey(name);
    const inSection = rows.filter((r) => normalizeCategoryKey(r.category?.categoryName) === key);
    // Pictures first inside a section so its feature card is rarely a placeholder.
    const fresh = inSection.filter((r) => !used.has(r.id));
    const ordered = [...fresh.filter((r) => r.imageUrl), ...fresh.filter((r) => !r.imageUrl)];
    const picks = ordered.slice(0, PER_SECTION).map(take);
    return { name, id: sectionId(name), hole: holeNumber(i), total: inSection.length, picks };
  });

  const leftover = rows.filter((r) => !used.has(r.id)).slice(0, LEFTOVER);
  return { lead, board, sections, leftover };
}
