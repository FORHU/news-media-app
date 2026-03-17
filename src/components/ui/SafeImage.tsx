"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  title?: string;
}

export function SafeImage({ src, fallbackSrc, alt, title, ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Sync state if src prop changes
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (hasError) return; // Prevent infinite loop if fallback also fails
    
    setHasError(true);
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      // Default placeholder if no fallback is provided
      const placeholderText = title || alt || "Image";
      setImgSrc(`https://placehold.co/800x400/e5e7eb/9ca3af?text=${encodeURIComponent(placeholderText.slice(0, 30))}`);
    }
  };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={hasError || props.unoptimized}
    />
  );
}
