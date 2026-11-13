"use client";

import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";
import "./pressbig.css";

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
