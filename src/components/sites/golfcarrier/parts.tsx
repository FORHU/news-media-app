import Link from "next/link";
import type { ReactNode } from "react";
import type { FeedRow } from "../technews-shared/feed";
import { excerpt } from "../technews-shared/feed";
import { StoryImage } from "./StoryImage";

/** "Nov 16", fixed to UTC so server and client render the same text. */
export function formatDay(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * "35m", "4h", or the day for anything older. Server components only: the
 * value depends on the clock, so rendering it on the client would mismatch.
 */
export function timeAgo(value: string, now = Date.now()): string {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.max(0, Math.round((now - t) / 60000));
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return formatDay(value);
}

/** Own articles open in place; wire stories open the publisher in a new tab. */
export function StoryLink({
  row,
  className,
  children,
}: {
  row: FeedRow;
  className?: string;
  children: ReactNode;
}) {
  if (row.external) {
    return (
      <a href={row.href} target="_blank" rel="noopener noreferrer nofollow" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={row.href} className={className}>
      {children}
    </Link>
  );
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Wire titles and descriptions often arrive with HTML entities (`wasn&#8217;t`). */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

/** Decodes the text fields of feed rows once, before rendering. */
export function cleanRows(rows: FeedRow[]): FeedRow[] {
  return rows.map((r) => ({ ...r, title: decodeEntities(r.title), content: decodeEntities(r.content) }));
}

/** Section name for own articles, publisher for wire stories. */
export function metaLabel(row: FeedRow): string {
  return (row.external ? row.source : null) ?? row.category?.categoryName ?? "";
}

export function StoryCard({
  row,
  feature = false,
  showDescription = false,
  kicker,
}: {
  row: FeedRow;
  /** Larger card that leads a section. */
  feature?: boolean;
  showDescription?: boolean;
  /** Small label above the headline (defaults to the story's section). */
  kicker?: string;
}) {
  const label = kicker ?? row.category?.categoryName ?? "";
  const source = metaLabel(row);
  return (
    <StoryLink row={row} className={`gc-card ${feature ? "gc-card--feature" : ""}`}>
      <div className="gc-card__img">
        <StoryImage src={row.imageUrl} />
      </div>
      <div className="gc-card__body">
        {label && <span className="gc-kicker">{label}</span>}
        <h3 className="gc-card__title">{row.title}</h3>
        {showDescription && row.content && <p className="gc-card__desc">{excerpt(row.content, feature ? 180 : 120)}</p>}
        <p className="gc-meta">
          {source && source !== label && <b>{source}</b>}
          <time dateTime={row.createdAt}>{formatDay(row.createdAt)}</time>
          {row.external && <span className="gc-meta__out" aria-label="opens the publisher's site">↗</span>}
        </p>
      </div>
    </StoryLink>
  );
}
