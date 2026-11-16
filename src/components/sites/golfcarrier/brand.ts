/**
 * GolfCarrier (golfcarrier.com) brand tokens: one place for the palette and type
 * the site components, logo and favicon share.
 *
 * Look: modern sports-editorial. Deep "ink" green and a clean sand ground, the
 * fairway green as the brand color, and a lime "flag" accent used sparingly
 * (live/new badges, the flag in the mark, underline on hover) and only on dark
 * or green backgrounds, never as text on sand.
 *
 * Contrast (WCAG, approx.): fairway on white 5.9:1, ink on sand 13.6:1, sand on fairway 5.3:1,
 * flag on ink 12:1, muted on sand 6.5:1. Fairway is safe for text and buttons; flag is not text-safe on light.
 */
export const GOLF_COLORS = {
  /** Headlines, body text, dark sections. */
  ink: "#0B2A1F",
  /** Brand color: buttons, links, section labels, the mark. */
  fairway: "#11724C",
  /** Hover/pressed for fairway. */
  fairwayDark: "#0C5A3B",
  /** Mowing-stripe partner for fairway in large green panels. */
  fairwayStripe: "#0F6845",
  /** Accent: the flag. Dark/green backgrounds only. */
  flag: "#D4F04C",
  /** Page background. */
  sand: "#F4F1E8",
  /** Cards and raised surfaces on sand. */
  white: "#FFFFFF",
  /** Hairlines and dividers on sand. */
  line: "#DCD6C6",
  /** Secondary text on sand (6.5:1). */
  muted: "#4A5A52",
} as const;

/**
 * Typefaces, all already self-hosted in src/app/fonts.ts (CSS variables set on <html>):
 *  - display: Archivo 800-900, tight tracking, for the wordmark feel, headlines, section heads
 *  - body:    Inter 400-600, for article text and UI
 *  - data:    IBM Plex Mono 500-600, uppercase + tracked, for scores, dates, kickers, bylines
 */
export const GOLF_FONTS = {
  display: "var(--font-archivo)",
  body: "var(--font-inter)",
  data: "var(--font-ibm-plex-mono)",
} as const;

export const GOLF_TAGLINE = "Every tour. Every shot.";
