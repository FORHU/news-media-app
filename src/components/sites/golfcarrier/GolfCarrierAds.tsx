"use client";

import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";

/**
 * Gutter ad beside the article, labelled, sticky, and only rendered where there
 * is room (>= 1380px, see .gc-rail). Uses the tenant's skyscraper (160x600) or
 * half-page (160x300) zone; GolfCarrier currently shares the technews stand-in
 * zone (see ADSTERRA_CONFIG), which only has the half-page.
 */
export function GolfCarrierAdRail({ side }: { side: "left" | "right" }) {
  const banners = ADSTERRA_CONFIG["golfcarrier"]?.banners;
  const tall = banners?.["160x600"];
  const half = banners?.["160x300"];
  const bannerKey = tall || half;
  // Keep the empty column so the article stays centred in the 3-column layout.
  if (!bannerKey) return <div className="gc-rail" aria-hidden="true" />;

  return (
    <aside className={`gc-rail gc-rail--${side}`} aria-label="Advertisement">
      <div className="gc-rail__inner">
        <span className="gc-ad-label">Advertisement</span>
        <AdsterraBanner bannerKey={bannerKey} width={160} height={tall ? 600 : 300} className="!my-0" />
      </div>
    </aside>
  );
}
