"use client";

import { StoryImage } from "@/components/StoryImage";

interface ArticleImageGalleryProps {
  images: string[];
  title: string;
  imageWrapperClassName?: string;
}

export function ArticleImageGallery({
  images,
  title,
  imageWrapperClassName = "overflow-hidden bg-gray-50 relative aspect-video border-y border-gray-100",
}: ArticleImageGalleryProps) {
  const extra = images.slice(1);
  if (extra.length === 0) return null;

  return (
    <>
      {extra.map((src, i) => (
        <div key={i} className={`my-8 ${imageWrapperClassName}`}>
          <StoryImage
            src={src}
            alt={`${title} — photo ${i + 2}`}
            fill
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
            variant="hero"
            hideTitle
          />
        </div>
      ))}
    </>
  );
}
