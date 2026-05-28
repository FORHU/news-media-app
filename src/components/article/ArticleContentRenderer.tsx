"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";
import { StoryImage } from "@/components/StoryImage";

interface ArticleContentRendererProps {
  paragraphs: string[];
  galleryImages: string[]; // article.imageUrls.slice(1) — no hero
  title: string;
  imageWrapperClassName?: string;
  textClassName?: string;
  firstTextClassName?: string; // optional override for first segment only (e.g. dropcap)
  adSlot?: ReactNode;
}

/**
 * Distributes gallery images throughout article text instead of grouping them.
 * Splits paragraphs into (numImages + 1) segments and interleaves one image
 * between each segment. The ad slot is placed after the last image.
 */
export function ArticleContentRenderer({
  paragraphs,
  galleryImages,
  title,
  imageWrapperClassName = "overflow-hidden bg-gray-50 relative aspect-video border-y border-gray-100",
  textClassName = "whitespace-pre-wrap break-words",
  firstTextClassName,
  adSlot,
}: ArticleContentRendererProps) {
  const numImages = galleryImages.length;
  const numSegments = numImages + 1;
  const segSize = paragraphs.length > 0 ? Math.ceil(paragraphs.length / numSegments) : 0;

  const segments: string[] = Array.from({ length: numSegments }, (_, i) =>
    paragraphs.slice(i * segSize, (i + 1) * segSize).join("\n\n")
  );

  // Ad goes after the last image, or after segment[0] if there are no images.
  const adAfterIndex = Math.max(numImages - 1, 0);

  return (
    <>
      {segments.map((segment, i) => (
        <Fragment key={i}>
          {segment && (
            <div className={i === 0 && firstTextClassName ? firstTextClassName : textClassName}>
              {segment}
            </div>
          )}

          {/* Insert one gallery image after each segment (except the last) */}
          {i < numImages && galleryImages[i] && (
            <div className={`my-8 ${imageWrapperClassName}`}>
              <StoryImage
                src={galleryImages[i]}
                alt={`${title} — photo ${i + 2}`}
                fill
                sizes="(max-width: 1024px) 100vw, 80vw"
                className="object-cover"
                variant="hero"
                hideTitle
              />
            </div>
          )}

          {/* Ad after the last image (or after first segment if no images) */}
          {i === adAfterIndex && adSlot}
        </Fragment>
      ))}
    </>
  );
}
