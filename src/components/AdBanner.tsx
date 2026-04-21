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
}

export function AdBanner({ position, className = "" }: AdBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch(`/api/banners?position=${position}`);
        if (res.ok) {
          const data = await res.json();
          setBanners(data);
        }
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, [position]);

  // Rotate banners if there are multiple for the same position
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIdx((prev) => (prev + 1) % banners.length);
      }, 8000); // Rotate every 8 seconds
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  if (loading || banners.length === 0) {
    // Hidden if no ad assigned, preventing layout shift if possible
    // Could also render a "Advertise here" placeholder if desired
    return null;
  }

  const activeBanner = banners[currentIdx];

  // Determine aspect ratio based on position
  const getAspectRatioClasses = () => {
    switch (position) {
      case "HOME_SIDEBAR":
      case "ARTICLE_SIDEBAR":
        return "aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/3]"; // More vertical/rectangular
      case "ARTICLE_IN_FEED":
      case "HOME_TOP":
      case "GLOBAL_FOOTER":
        return "aspect-[4/1] sm:aspect-[7/1] lg:aspect-[10/1]"; // Leaderboard/Ribbon
      default:
        return "aspect-[3/1] sm:aspect-[7/1] lg:aspect-[10/1]";
    }
  };

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBanner.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`relative ${getAspectRatioClasses()} rounded-xl overflow-hidden bg-gray-100 border border-gray-200 transition-all duration-300`}
        >
          <Link
            href={activeBanner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <Image
              src={activeBanner.imageUrl}
              alt={activeBanner.altText || "Advertisement"}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold text-gray-900 border border-white/20">
                <span>Visit Sponsor</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </Link>
          {/* Ad Label */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <span className="bg-gray-900/40 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-md font-medium uppercase tracking-widest border border-white/10">
              Sponsored
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
