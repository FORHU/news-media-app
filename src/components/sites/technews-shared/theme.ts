import type { CSSProperties } from "react";

/**
 * Shared theme system for the "technews" tenant family.
 *
 * Seven domains (LinkTechnews, DbTechnews, MagazineTechy, MagazineAir, TechyGate,
 * NewYorkSignal, TechOggi) share the same page skeleton and differ only by the
 * values in this file: palette, wordmark rendering, section-label rendering, and
 * a single signature motif. Fonts are swapped per domain in globals.css via the
 * `.site-theme-<domain>-com` blocks, which remap the semantic `--font-serif` /
 * `--font-sans` / `--font-mono` slots the components reference.
 *
 * Each domain keeps its own component folder (`sites/<key>/<Name>Header|Footer|
 * Landing|Article.tsx`) matching the rest of the frontend; this folder
 * (`sites/technews-shared/`) holds only what every domain imports: this theme,
 * `feed.ts`, `parts.tsx`, and `FeedLink.tsx`.
 *
 * To bring a new domain online:
 *   1. Add its palette + knobs to TECHNEWS_THEMES below.
 *   2. Add it to TECHNEWS_ACTIVE_DOMAINS (this is the route-level on switch).
 *   3. Add a `.site-theme-<key>-com` font block to globals.css.
 *   4. Add name/icon/logo/description branches to tenant-utils.ts,
 *      a DOMAIN_COLORS entry, an ADSTERRA_CONFIG entry, a categories.ts entry,
 *      and the domain to next.config.ts allowedDevOrigins.
 */

export type WordmarkStyle =
  | "chip" //      ▸LINKTECHNEWS   (accent bracket + solid block)
  | "prompt" //    db.technews_    (lowercase mono + blinking caret)
  | "feature" //   Magazine Techy  (serif caps, hairline rule under)
  | "hairline" //  MAGAZINE / AIR  (thin letterspaced, stacked)
  | "gate" //     |TECHYGATE|      (condensed heavy between two bars)
  | "broadsheet" // The New York Signal (serif caps + signal ticks)
  | "underline"; // TechOggi        (rounded sans + thick accent underline bar)

export type LabelStyle =
  | "monoArrow" //   ▸ SECTION
  | "prompt" //      » section
  | "serifRule" //   Section  (small serif, hairline over)
  | "ruleOver" //    ─────  SECTION  (letterspaced, rule above)
  | "solidBlock" //  ███ SECTION (condensed, filled)
  | "ticks" //       ╎╎╎ SECTION (signal ticks + rule)
  | "pillDot"; //    ● Section  (accent dot in a soft rounded pill)

export interface TechNewsTheme {
  /** short key, e.g. "linktechnews" — matches the globals.css `.site-theme-<key>-com` block */
  key: string;
  /** full host, e.g. "linktechnews.com" */
  domain: string;
  /** display name for prose ("© LinkTechnews") */
  name: string;
  /** wordmark segments — `accent` is painted in the accent colour */
  wordmark: { pre?: string; main: string; accent?: string; post?: string };
  wordmarkStyle: WordmarkStyle;
  labelStyle: LabelStyle;
  /** short line under the masthead / in the footer brand block */
  tagline: string;
  /** appears as the article dateline chip, e.g. "BY LINKTECHNEWS" */
  byline: string;
  /** rail heading on the landing page; null hides the rail */
  railLabel: string | null;
  /** show `▸ source.com` chips on headlines (link-forward domains only) */
  sourceChips: boolean;
  /** corner radius applied to cards / chips / images */
  radius: string;

  // ── palette ────────────────────────────────────────────────
  ink: string; //        primary text / masthead
  bg: string; //         page background
  surface: string; //    raised cards
  accent: string; //     links, active state, section blocks
  accentSoft: string; // accent tint fills
  accentInk: string; //  text on top of `accent`
  rule: string; //       hairlines, borders
  muted: string; //      secondary text, timestamps
}

const THEMES: TechNewsTheme[] = [
  {
    key: "linktechnews",
    domain: "linktechnews.com",
    name: "LinkTechnews",
    wordmark: { pre: "▸", main: "LINK", accent: "TECH", post: "NEWS" },
    wordmarkStyle: "chip",
    labelStyle: "monoArrow",
    tagline: "The technology wire — every story worth the click, in one feed.",
    byline: "LINKTECHNEWS",
    railLabel: "The Wire",
    sourceChips: true,
    radius: "2px",
    ink: "#14161F",
    bg: "#FBFBFD",
    surface: "#FFFFFF",
    accent: "#3B39E4",
    accentSoft: "#ECECFC",
    accentInk: "#FFFFFF",
    rule: "#E3E3EA",
    muted: "#6B6F80",
  },
  {
    key: "dbtechnews",
    domain: "dbtechnews.com",
    name: "DbTechnews",
    wordmark: { pre: "", main: "db.technews", accent: "_", post: "" },
    wordmarkStyle: "prompt",
    labelStyle: "prompt",
    tagline: "Infrastructure, data, and the systems that run everything else.",
    byline: "DBTECHNEWS",
    railLabel: "Latest Commits",
    sourceChips: true,
    radius: "6px",
    ink: "#0C1A2B",
    bg: "#E9EEF3",
    surface: "#FFFFFF",
    accent: "#2F6FEB",
    accentSoft: "#DCE8FB",
    accentInk: "#FFFFFF",
    rule: "#C6D1DD",
    muted: "#566575",
  },
  {
    key: "magazinetechy",
    domain: "magazinetechy.com",
    name: "Magazine Techy",
    wordmark: { pre: "", main: "Magazine", accent: " Techy", post: "" },
    wordmarkStyle: "feature",
    labelStyle: "serifRule",
    tagline: "Long looks at the people and ideas shaping technology.",
    byline: "MAGAZINE TECHY",
    railLabel: "In This Issue",
    sourceChips: false,
    radius: "0px",
    ink: "#1C1512",
    bg: "#FBF6EF",
    surface: "#FFFFFF",
    accent: "#D81E5B",
    accentSoft: "#FBE1EB",
    accentInk: "#FFFFFF",
    rule: "#EBE2D4",
    muted: "#6E6257",
  },
  {
    key: "magazineair",
    domain: "magazineair.com",
    name: "Magazine Air",
    wordmark: { pre: "", main: "MAGAZINE", accent: "AIR", post: "" },
    wordmarkStyle: "hairline",
    labelStyle: "ruleOver",
    tagline: "Technology, lightly held. Clear reporting with room to breathe.",
    byline: "MAGAZINE AIR",
    railLabel: "Also Reading",
    sourceChips: false,
    radius: "0px",
    ink: "#33434D",
    bg: "#F3F8FA",
    surface: "#FFFFFF",
    accent: "#227D96",
    accentSoft: "#E1F0F3",
    accentInk: "#FFFFFF",
    rule: "#E2ECEF",
    muted: "#7B8990",
  },
  {
    key: "techygate",
    domain: "techygate.com",
    name: "TechyGate",
    wordmark: { pre: "", main: "TECHY", accent: "GATE", post: "" },
    wordmarkStyle: "gate",
    labelStyle: "solidBlock",
    tagline: "Your gateway to the day in technology.",
    byline: "TECHYGATE",
    railLabel: "Fast Lane",
    sourceChips: false,
    radius: "0px",
    ink: "#0F0F0F",
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    accent: "#F1530A",
    accentSoft: "#FDE6D7",
    accentInk: "#FFFFFF",
    rule: "#E6E6E6",
    muted: "#5E5E5E",
  },
  {
    key: "newyorksignal",
    domain: "newyorksignal.com",
    name: "New York Signal",
    wordmark: { pre: "The New York ", main: "Signal", accent: "", post: "" },
    wordmarkStyle: "broadsheet",
    labelStyle: "ticks",
    tagline: "Dispatches on technology from the city that never logs off.",
    byline: "NEW YORK SIGNAL",
    railLabel: "On the Wire",
    sourceChips: false,
    radius: "0px",
    ink: "#1A1613",
    bg: "#F4F0E6",
    surface: "#FBF9F3",
    accent: "#7C231E",
    accentSoft: "#EEDFDB",
    accentInk: "#FFFFFF",
    rule: "#E0D7C5",
    muted: "#6A6153",
  },
  {
    key: "techoggi",
    domain: "techoggi.com",
    name: "Tech Oggi",
    wordmark: { pre: "", main: "Tech", accent: "Oggi", post: "" },
    wordmarkStyle: "underline",
    labelStyle: "pillDot",
    tagline: "La tecnologia, oggi — le notizie essenziali della giornata, in sintesi.",
    byline: "TECH OGGI",
    railLabel: "Il Filo di Oggi",
    sourceChips: true,
    radius: "12px",
    ink: "#12241C",
    bg: "#F6FBF8",
    surface: "#FFFFFF",
    accent: "#0EA968",
    accentSoft: "#DFF5EA",
    accentInk: "#FFFFFF",
    rule: "#DCEAE1",
    muted: "#5B6E63",
  },
];

export const TECHNEWS_THEMES: Record<string, TechNewsTheme> = Object.fromEntries(
  THEMES.map((t) => [t.domain, t]),
);

/** Every domain in the technews tenant family. */
export const TECHNEWS_KNOWN_DOMAINS: string[] = THEMES.map((t) => t.domain);

export function getTechNewsTheme(domain: string | null | undefined): TechNewsTheme | null {
  if (!domain) return null;
  const d = domain.toLowerCase();
  const exact = TECHNEWS_THEMES[d];
  if (exact) return exact;
  const match = THEMES.find((t) => d.includes(t.key));
  return match ?? null;
}

/** True when this domain belongs to the technews tenant family. */
export function isTechNewsDomain(domain: string | null | undefined): boolean {
  return getTechNewsTheme(domain) !== null;
}

/** CSS custom properties consumed by the shared components via `[var(--tn-*)]`. */
export function techNewsVars(theme: TechNewsTheme): CSSProperties {
  return {
    ["--tn-ink" as string]: theme.ink,
    ["--tn-bg" as string]: theme.bg,
    ["--tn-surface" as string]: theme.surface,
    ["--tn-accent" as string]: theme.accent,
    ["--tn-accent-soft" as string]: theme.accentSoft,
    ["--tn-accent-ink" as string]: theme.accentInk,
    ["--tn-rule" as string]: theme.rule,
    ["--tn-muted" as string]: theme.muted,
    ["--tn-radius" as string]: theme.radius,
  };
}
