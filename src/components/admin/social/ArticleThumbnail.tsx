"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { PublishableArticle } from "@/types/socialPublishing";

export function ArticleThumbnail({ article }: { article: PublishableArticle }) {
  const [imgError, setImgError] = useState(false);

  if (!article.imageUrl || imgError) {
    return (
      <div className="shrink-0 w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
        <ImageOff className="w-5 h-5 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
      <Image
        src={`/api/admin/proxy-image?url=${encodeURIComponent(article.imageUrl)}`}
        alt={article.title}
        fill
        sizes="56px"
        className="object-cover"
        unoptimized
        onError={() => setImgError(true)}
      />
    </div>
  );
}
