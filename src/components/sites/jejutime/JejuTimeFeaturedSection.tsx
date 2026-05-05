"use client";

import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";

interface Props {
  articles: any[];
}

export default function JejuTimeFeaturedSection({ articles }: Props) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="mb-6 sm:mb-16">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
        <h3 className="text-2xl font-baskerville font-black text-blue-950">Featured Collections</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/article/${article.slug || article.id}`}
            className="group block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-video overflow-hidden mb-4 bg-slate-100">
              <StoryImage
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 400px, 250px"
              />
            </div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-2">
              {article.category?.categoryName}
            </span>
            <h4 className="text-md font-bold leading-tight group-hover:text-blue-600 transition-colors">
              {article.title}
            </h4>
          </Link>
        ))}
      </div>
    </section>
  );
}
