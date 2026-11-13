import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { FeedRow } from "../technews-shared/feed";
import { excerpt } from "../technews-shared/feed";
import type { Tone } from "./edit";
import "./pressbig.css";

/**
 * The two SVG filters every torn edge uses (see .pb-paper in pressbig.css).
 * Rendered once, by the header, so the ids exist on every PressBig page.
 * objectBoundingBox margins are generous so displaced edges are never clipped
 * on thin elements such as the buttons.
 */
export function PaperDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="pb-tear" x="-15%" y="-40%" width="130%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.022" numOctaves="4" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="15" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="pb-fiber" x="-15%" y="-40%" width="130%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="5" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="24" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/** PRESS in black, BIG on a torn red strip. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`pb-wordmark ${className}`}>
      PRESS<span className="pb-wordmark__big pb-paper">BIG</span>
    </span>
  );
}

function formatDay(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * One story pasted on the wall. External (wire) stories open the publisher in a
 * new tab, credited by source; PressBig's own articles open in place. The
 * picture is halftoned and tinted until hovered or focused.
 */
export function Scrap({
  row,
  tone,
  lead = false,
  showDescription = false,
  leadTag = false,
  style,
  className = "",
  label,
}: {
  row: FeedRow;
  tone?: Tone;
  lead?: boolean;
  showDescription?: boolean;
  /** Adds a black LEAD PICK chip above the headline. */
  leadTag?: boolean;
  style?: CSSProperties;
  className?: string;
  /** Overrides the meta label (defaults to the source for wire stories, the section for own articles). */
  label?: string;
}) {
  const meta = label ?? (row.external ? row.source : row.category?.categoryName) ?? "";
  const body: ReactNode = (
    <>
      {row.imageUrl && (
        <div className="pb-half">
          {/* eslint-disable-next-line @next/next/no-img-element -- wire images come from arbitrary publisher hosts */}
          <img src={row.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        </div>
      )}
      <div className="pb-scrap__text">
        {leadTag && <span className="pb-tag pb-scrap__lead">Lead pick</span>}
        <h3 className="pb-scrap__title">{row.title}</h3>
        {showDescription && row.content && <p className="pb-scrap__desc">{excerpt(row.content, lead ? 170 : 130)}</p>}
        <p className="pb-scrap__meta">
          {meta && <b>{meta}</b>}
          <time dateTime={row.createdAt}>{formatDay(row.createdAt)}</time>
        </p>
      </div>
    </>
  );

  const cls = `pb-scrap ${lead ? "pb-scrap--lead" : ""} ${className}`.trim();
  const toneStyle = tone ? ({ "--tint": `var(--pb-${tone})`, ...style } as CSSProperties) : style;

  if (row.external) {
    return (
      <a href={row.href} target="_blank" rel="noopener noreferrer nofollow" className={cls} style={toneStyle}>
        {body}
      </a>
    );
  }
  return (
    <Link href={row.href} className={cls} style={toneStyle}>
      {body}
    </Link>
  );
}
