"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { getFallbackColor } from "@/lib/image-utils";

interface StoryImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  hideTitle?: boolean;
  variant?: "hero" | "featured" | "thumbnail";
}

export function StoryImage(props: StoryImageProps) {
  const { src, alt, fill, width, height, className, priority, sizes, variant = "featured", hideTitle } = props;
  const [imgSrc, setImgSrc] = useState<string | null>(src || null);
  const [error, setError] = useState(false);
  const isBlockedS3Origin = false;

  useEffect(() => {
    // Resync imgSrc/error when the src prop changes (e.g. carousel swapping
    // images on an already-mounted instance) — resets the error fallback too.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImgSrc(src || null);
    setError(false);
  }, [src]);

  const color = useMemo(() => getFallbackColor(alt), [alt]);

  // Variant-specific base configurations
  const config = {
    hero: {
      padding: "p-4 sm:p-8 md:p-16",
      minFont: "1.25rem",
      maxFont: "3rem",
      lineClamp: "line-clamp-3"
    },
    featured: {
      padding: "p-4 md:p-8",
      minFont: "0.875rem",
      maxFont: "1.75rem",
      lineClamp: "line-clamp-3"
    },
    thumbnail: {
      padding: "p-2 sm:p-4",
      minFont: "0.65rem",
      maxFont: "1rem",
      lineClamp: "line-clamp-2"
    }
  }[variant];

  if (!imgSrc || error || isBlockedS3Origin) {
    return (
      <div 
        className={`${className} flex items-center justify-center ${config.padding} text-center leading-tight overflow-hidden`}
        style={{ 
          backgroundColor: color,
          color: 'black',
          width: '100%',
          height: '100%',
          position: fill ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          containerType: 'inline-size'
        }}
      >
        {!hideTitle && (
          <span 
            className={`font-black uppercase tracking-tighter drop-shadow-xl ${config.lineClamp}`}
            style={{ 
              // Scales exactly based on the container width now
              fontSize: `clamp(${config.minFont}, 8cqw, ${config.maxFont})`,
              lineHeight: '1.1'
            }}
          >
            {alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes ?? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      className={className}
      onError={() => {
        setError(true);
      }}
    />
  );
}
