"use client";

import { useEffect, useState } from "react";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import "./pressbig.css";

type StripSize = { key: "728x90" | "468x60" | "320x50"; width: number; height: number };

/** The widest banner that fits the viewport with the cut-out's padding. */
function pickStripSize(viewportWidth: number): StripSize {
  if (viewportWidth >= 820) return { key: "728x90", width: 728, height: 90 };
  if (viewportWidth >= 560) return { key: "468x60", width: 468, height: 60 };
  return { key: "320x50", width: 320, height: 50 };
}

/**
 * A horizontal ad between sections on the home and section pages: one chalk
 * cut-out, tilted, labelled. Only one banner size is mounted (chosen after
 * hydration), so a phone never loads the desktop zone behind display:none.
 */
export function PressBigAdStrip({ tilt = "left" }: { tilt?: "left" | "right" }) {
  const [size, setSize] = useState<StripSize | null>(null);

  useEffect(() => {
    const update = () => {
      const next = pickStripSize(window.innerWidth);
      setSize((prev) => (prev && prev.key === next.key ? prev : next));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const bannerKey = size ? ADSTERRA_CONFIG["pressbig"]?.banners?.[size.key] : undefined;
  if (!size || !bannerKey) return null;

  return (
    <aside className={`pb-adstrip pb-adstrip--${tilt}`} aria-label="Advertisement">
      <div className="pb-ad pb-paper pb-lift">
        <span className="pb-tag pb-ad__label">Advertisement</span>
        <AdsterraBanner bannerKey={bannerKey} width={size.width} height={size.height} className="!my-0" />
      </div>
    </aside>
  );
}

/**
 * A gutter ad on the article page, pasted up like everything else on the wall:
 * a cut-out chalk scrap with a torn edge, tilted slightly, always labelled.
 * Rendered only where there is room (>= 1380px, see .pb-rail in pressbig.css) and
 * only when the tenant has a skyscraper (160x600) or half-page (160x300) zone.
 */
export function PressBigAdRail({ side }: { side: "left" | "right" }) {
  const banners = ADSTERRA_CONFIG["pressbig"]?.banners;
  const tall = banners?.["160x600"];
  const half = banners?.["160x300"];
  const bannerKey = tall || half;
  if (!bannerKey) return null;

  return (
    <aside className={`pb-rail pb-rail--${side}`} aria-label="Advertisement">
      <div className="pb-ad pb-paper pb-lift">
        <span className="pb-tag pb-ad__label">Advertisement</span>
        <AdsterraBanner bannerKey={bannerKey} width={160} height={tall ? 600 : 300} className="!my-0" />
      </div>
    </aside>
  );
}
