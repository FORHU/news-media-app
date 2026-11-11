"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";

/**
 * In-page category / filter control that navigates to a /search?category=...
 * facet WITHOUT being a crawlable <a href>.
 *
 * Those facet URLs are noindex,follow thin result pages; exposing hundreds of
 * them as plain anchors made Google crawl them and report soft 404s and
 * duplicate/alternate-canonical entries. This renders a focusable
 * `role="link"` element that navigates on click / Enter, so the facet stays
 * fully usable for visitors but is not an href for crawlers to follow.
 *
 * Drop-in for next/link where the destination is a facet URL: same
 * `href`, `className`, `style`, `onClick` and children.
 */
export function FacetLink({
  href,
  className,
  style,
  children,
  onClick,
  title,
  ...aria
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  title?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | "true" | boolean;
}) {
  const router = useRouter();

  const go = () => router.push(href);

  return (
    <span
      role="link"
      tabIndex={0}
      data-facet-link
      className={`cursor-pointer ${className ?? ""}`}
      style={style}
      title={title}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) go();
      }}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          go();
        }
      }}
      {...aria}
    >
      {children}
    </span>
  );
}

export default FacetLink;
