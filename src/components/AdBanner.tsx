"use client";

import { useId, useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";

export interface Banner {
  id: string;
  name: string;
  bannerType?: string;
  imageUrl: string | null;
  youtubeUrl: string | null;
  linkUrl: string;
  altText: string | null;
  positions: string[];
}

function getYouTubeVideoId(url: string | null): string | null {
  if (!url) return null;
  let videoId = "";
  if (url.includes("v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("embed/")) {
    videoId = url.split("embed/")[1]?.split("?")[0];
  } else if (url.includes("shorts/")) {
    videoId = url.split("shorts/")[1]?.split("?")[0];
  } else if (url.includes("live/")) {
    videoId = url.split("live/")[1]?.split("?")[0];
  }
  return videoId || null;
}

interface AdBannerProps {
  position: string;
  className?: string;
  initialIndex?: number;
  /** Pre-fetched banners from the server. When provided, the client-side fetch is skipped entirely. */
  initialBanners?: Banner[];
}

export function AdBanner({ 
  position, 
  className = "", 
  initialIndex = 0,
  initialBanners,
}: AdBannerProps) {
  // If the server pre-fetched banners, use them directly — no client fetch needed.
  const [banners, setBanners] = useState<Banner[]>(() => {
    if (initialBanners && initialBanners.length > 0) return initialBanners;
    return [];
  });
  const [currentIdx, setCurrentIdx] = useState(() => {
    if (initialBanners && initialBanners.length > 0) {
      return initialIndex % initialBanners.length;
    }
    return 0;
  });
  const [loading, setLoading] = useState(() => !initialBanners || (Array.isArray(initialBanners) && initialBanners.length === 0));

  useEffect(() => {
    // Skip the client-side fetch if the server already provided banners.
    if (initialBanners && initialBanners.length > 0) return;

    async function fetchBanners() {
      try {
        const res = await fetch(`/api/banners?position=${position}`);
        if (res.ok) {
          const data = await res.json();
          setBanners(data);
          if (data.length > 0) {
            setCurrentIdx(initialIndex % data.length);
          }
        }
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, [position, initialIndex, initialBanners]);

  // Rotate banners if there are multiple for the same position
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % banners.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [banners.length]); // Only length matters; avoid ref-equality resets

  // Determine aspect ratio based on position
  const getAspectRatioClasses = (isVideoAd: boolean) => {
    switch (position) {
      case "HOME_SIDEBAR":
      case "ARTICLE_SIDEBAR":
      case "SIDEBAR_L_TOP":
      case "SIDEBAR_L_MID":
      case "SIDEBAR_R_MID":
      case "SIDEBAR_R_BTM":
        return isVideoAd ? "aspect-video" : "aspect-[16/9] sm:aspect-[3/2]"; // Optimized for video vs image
      case "HOME_TOP":
      case "GLOBAL_FOOTER":
      case "CONTENT_MID":
        return "aspect-[16/9] sm:aspect-[7/1] lg:aspect-[10/1]"; // Leaderboard/Ribbon
      default:
        return "aspect-[16/9] sm:aspect-[3/1] lg:aspect-[10/1]";
    }
  };

  if (loading) {
    return null;
  }

  if (banners.length === 0) {
    return null;
  }

  const activeBanner = banners[currentIdx];
  const isVideo = activeBanner.bannerType === "VIDEO" || !!activeBanner.youtubeUrl;
  const videoId = isVideo ? getYouTubeVideoId(activeBanner.youtubeUrl) : null;

  return (
    <div className={`w-full relative overflow-hidden group ${isVideo ? "rounded-none" : "rounded-xl"} border border-gray-200 bg-black ${getAspectRatioClasses(isVideo)} ${className}`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={activeBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
        >
          <Link
            href={activeBanner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full relative"
          >
            {isVideo && videoId ? (
              <div className="w-full h-full relative z-0 overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1`}
                  title={activeBanner.name}
                  className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
                {/* Overlay to catch clicks for the Link */}
                <div className="absolute inset-0 z-10" />
              </div>
            ) : (
              <>
                {/* Background Blur Layer */}
                {activeBanner.imageUrl && (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <Image
                      src={activeBanner.imageUrl}
                      alt=""
                      fill
                      className="object-cover blur-2xl scale-110 opacity-50"
                      unoptimized
                    />
                  </div>
                )}

                {/* Foreground Content Layer */}
                {activeBanner.imageUrl ? (
                  <Image
                    src={activeBanner.imageUrl}
                    alt={activeBanner.altText || "Advertisement"}
                    fill
                    className="object-contain relative z-10 transition-transform duration-700 group-hover:scale-[1.02]"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                    {activeBanner.name}
                  </div>
                )}
                
                {/* Ad Label for Images */}
                <div className="absolute top-2 left-2 pointer-events-none z-20">
                  <span className="bg-gray-900/40 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-md font-medium uppercase tracking-widest border border-white/10">
                    Sponsored
                  </span>
                </div>
              </>
            )}

            {/* Hover overlay hint (Global) */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-30">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold text-gray-900 border border-white/20">
                <span>Visit Sponsor</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
