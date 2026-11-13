import { normalizeCategoryKey } from "@/config/categories";
import type { FeedRow } from "../technews-shared/feed";

export type Tone = "black" | "indigo" | "red" | "wheat";

/** PressBig's four sections, each with the ink it is pasted up in. */
export const PB_SECTIONS: ReadonlyArray<{ name: string; tone: Tone }> = [
  { name: "Entertainment", tone: "black" },
  { name: "Fashion & Style", tone: "indigo" },
  { name: "Gadgets", tone: "red" },
  { name: "Celebrity & Culture", tone: "wheat" },
];

export function sectionHref(name: string): string {
  return `/search?category=${encodeURIComponent(name)}`;
}

export function sectionId(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export interface EditSection {
  name: string;
  tone: Tone;
  id: string;
  /** Stories shown in this section's band on the home page (never repeated elsewhere on the page). */
  picks: FeedRow[];
}

export interface DailyEdit {
  /** The lead pick followed by the two other stories pasted over the tear. */
  hero: FeedRow[];
  sections: EditSection[];
  /** Newest stories not used above, for the closing wall. */
  leftover: FeedRow[];
}

const PER_SECTION = 5;
const LEFTOVER = 8;

/**
 * Chooses the day's edit from the blended feed (already newest-first, with an
 * editor's headline pin or trending score floating a row up). Every story is
 * placed once: the hero scraps first, then each section's own picks, then a
 * closing wall of what is left. Stories without a picture are skipped because a
 * torn-paper card without a photo reads as a hole in the wall.
 */
export function buildEdit(rows: FeedRow[]): DailyEdit {
  const withImage = rows.filter((r) => r.imageUrl);
  const used = new Set<string>();
  const take = (r: FeedRow) => {
    used.add(r.id);
    return r;
  };

  const hero = withImage.slice(0, 3).map(take);

  const sections = PB_SECTIONS.map(({ name, tone }) => {
    const key = normalizeCategoryKey(name);
    const picks = withImage
      .filter((r) => !used.has(r.id) && normalizeCategoryKey(r.category?.categoryName) === key)
      .slice(0, PER_SECTION)
      .map(take);
    return { name, tone, id: sectionId(name), picks };
  });

  const leftover = withImage.filter((r) => !used.has(r.id)).slice(0, LEFTOVER);
  return { hero, sections, leftover };
}
