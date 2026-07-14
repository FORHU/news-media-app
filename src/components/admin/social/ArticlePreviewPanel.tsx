"use client";

import Image from "next/image";
import { ExternalLink, X } from "lucide-react";
import type { PublishableArticle } from "@/types/socialPublishing";

export function ArticlePreviewPanel({
  article,
  onClose,
}: {
  article: PublishableArticle;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-8 h-fit bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-bold text-gray-900 truncate pr-4">{article.title}</p>
        <div className="shrink-0 flex items-center gap-3">
          {article.slug && (
            <a
              href={`https://${article.tenantDomain}/article/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />Live Site
            </a>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {article.imageUrl && (
        <div className="relative w-full h-48 bg-gray-100">
          <Image
            src={`/api/admin/proxy-image?url=${encodeURIComponent(article.imageUrl)}`}
            alt={article.title}
            fill
            sizes="600px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div
        className="px-5 py-4 prose prose-sm max-w-none max-h-[50vh] overflow-y-auto text-gray-700 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
}
