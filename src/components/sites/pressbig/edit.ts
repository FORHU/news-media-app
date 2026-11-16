import { normalizeCategoryKey } from "@/config/categories";
import type { FeedRow } from "../technews-shared/feed";

export type Tone = "black" | "indigo" | "red" | "wheat";

/** How loud a section's strip is on the home hero: entertainment leads, style and tech sit small. */
export type Rank = "lead" | "mid" | "half";

/** PressBig's six sections (entertainment first), each with the ink it is pasted up in.
 *  Only four inks exist, so the quieter Style and Tech repeat black and red; they are
 *  never adjacent to the same ink. `short` is the header nav label. */
export const PB_SECTIONS: ReadonlyArray<{ name: string; short: string; tone: Tone; rank: Rank }> = [
  { name: "Movies & TV", short: "Movies & TV", tone: "black", rank: "lead" },
  { name: "Music & Celebrity", short: "Music", tone: "red", rank: "lead" },
  { name: "Gaming", short: "Gaming", tone: "indigo", rank: "mid" },
  { name: "Viral & Pop Culture", short: "Viral", tone: "wheat", rank: "mid" },
  { name: "Style", short: "Style", tone: "black", rank: "half" },
  { name: "Tech", short: "Tech", tone: "red", rank: "half" },
];

export function sectionHref(name: string): string {
  return `/search?category=${encodeURIComponent(name)}`;
}

export function sectionId(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** The ink a story's picture is tinted in: its section's, or undefined for a story outside the six. */
export function toneForRow(row: FeedRow): Tone | undefined {
  const key = normalizeCategoryKey(row.category?.categoryName);
  return PB_SECTIONS.find((s) => normalizeCategoryKey(s.name) === key)?.tone;
}

export interface EditSection {
  name: string;
  tone: Tone;
  rank: Rank;
  /** True when the section has any story at all, even if the hero scraps or the photo filter used them up. */
  available: boolean;
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

/** Picks per home band: the two entertainment leads get five, every other section three, so the
 *  page reads as an edit (about 29 stories with the hero and closing wall), not a dump of ~41. */
const PICKS: Record<Rank, number> = { lead: 5, mid: 3, half: 3 };
const LEFTOVER = 4;

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

  const sections = PB_SECTIONS.map(({ name, tone, rank }) => {
    const key = normalizeCategoryKey(name);
    const available = rows.some((r) => normalizeCategoryKey(r.category?.categoryName) === key);
    const picks = withImage
      .filter((r) => !used.has(r.id) && normalizeCategoryKey(r.category?.categoryName) === key)
      .slice(0, PICKS[rank])
      .map(take);
    return { name, tone, rank, available, id: sectionId(name), picks };
  });

  const leftover = withImage.filter((r) => !used.has(r.id)).slice(0, LEFTOVER);
  return { hero, sections, leftover };
}
