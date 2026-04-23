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
  variant?: "hero" | "featured" | "thumbnail";
}

export function StoryImage({ 
  src, 
  alt, 
  fill, 
  width, 
  height, 
  className, 
  priority,
  sizes,
  variant = "featured"
}: StoryImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgSrc(src || null);
    setError(false);
  }, [src]);

  const color = useMemo(() => getFallbackColor(alt), [alt]);

  // Variant-specific base configurations
  const config = {
    hero: {
      padding: "p-8 md:p-16",
      minFont: "1.5rem",
      maxFont: "3.5rem",
      lineClamp: "line-clamp-4"
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

  if (!imgSrc || error) {
    return (
      <div 
        className={`${className} flex items-center justify-center ${config.padding} text-center leading-tight overflow-hidden`}
        style={{ 
          backgroundColor: color,
          color: 'white',
          width: '100%',
          height: '100%',
          position: fill ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          containerType: 'inline-size'
        }}
      >
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
