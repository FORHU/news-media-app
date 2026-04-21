"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string | null;
  position: string;
}

interface AdBannerProps {
  position: string;
  className?: string;
  initialIndex?: number;
}

export function AdBanner({ 
  position, 
  className = "", 
  initialIndex = 0 
}: AdBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0); // Initialized properly after fetch
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch(`/api/banners?position=${position}`);
        if (res.ok) {
          const data = await res.json();
          setBanners(data);
          // Set initial index based on available banners
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
  }, [position, initialIndex]);

  // Rotate banners if there are multiple for the same position
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % banners.length);
      }, 7000); // 7s for slightly faster, smoother feeling rotation
      return () => clearInterval(interval);
    }
  }, [banners.length, banners]); // Added banners for safety

  if (loading || banners.length === 0) {
    return null;
  }

  const activeBanner = banners[currentIdx];

  // Determine aspect ratio based on position
  const getAspectRatioClasses = () => {
    switch (position) {
      case "HOME_SIDEBAR":
      case "ARTICLE_SIDEBAR":
        return "aspect-[3/2] sm:aspect-[3/2] lg:aspect-[3/2]"; // Optimized for stacking
      case "ARTICLE_IN_FEED":
      case "HOME_TOP":
      case "GLOBAL_FOOTER":
        return "aspect-[4/1] sm:aspect-[7/1] lg:aspect-[10/1]"; // Leaderboard/Ribbon
      default:
        return "aspect-[3/1] sm:aspect-[7/1] lg:aspect-[10/1]";
    }
  };

  return (
    <div className={`relative overflow-hidden group rounded-xl border border-gray-200 bg-gray-100 ${getAspectRatioClasses()} ${className}`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={activeBanner.id}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ 
            x: { type: "spring", stiffness: 300, damping: 30 },
          }}
          className="absolute inset-0 w-full h-full"
        >
          <Link
            href={activeBanner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full relative"
          >
            {/* Background Blur Layer */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <Image
                src={activeBanner.imageUrl}
                alt=""
                fill
                className="object-cover blur-2xl scale-110 opacity-50"
                unoptimized
              />
            </div>

            {/* Foreground Content Layer */}
            <Image
              src={activeBanner.imageUrl}
              alt={activeBanner.altText || "Advertisement"}
              fill
              className="object-contain relative z-10 transition-transform duration-700 group-hover:scale-[1.02]"
              unoptimized
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold text-gray-900 border border-white/20">
                <span>Visit Sponsor</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
            
            {/* Ad Label - Moved inside Link or kept absolute in motion.div */}
            <div className="absolute top-2 left-2 pointer-events-none z-10">
              <span className="bg-gray-900/40 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-md font-medium uppercase tracking-widest border border-white/10">
                Sponsored
              </span>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
