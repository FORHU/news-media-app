"use client";

import { useEffect, useRef, useState } from "react";
import { GolfMark } from "./mark";

/**
 * A story picture that falls back to the mowed-fairway placeholder when there
 * is no image or the publisher's host refuses it (hotlink blocks and dead
 * links are common in the wire feed).
 */
export function StoryImage({ src, eager = false }: { src: string | null; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // An image that failed before hydration never fires onError, so check once on mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!src || failed) {
    return (
      <div className="gc-ph" aria-hidden="true">
        <GolfMark size={44} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- wire images come from arbitrary publisher hosts
    <img
      ref={ref}
      src={src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
