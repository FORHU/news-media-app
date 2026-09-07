import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { FeedRow } from "./feed";

/**
 * Renders an internal <Link> for DB rows and an external <a target="_blank"> for
 * MediaStack rows, so the ported layouts don't each re-implement the branch.
 */
export function FeedLink({
  row,
  className,
  style,
  children,
  "aria-label": ariaLabel,
}: {
  row: FeedRow;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  "aria-label"?: string;
}) {
  if (row.external) {
    return (
      <a
        href={row.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={row.href} className={className} style={style} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
