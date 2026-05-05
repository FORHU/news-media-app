"use client";

import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";

interface Props {
  products: any[];
}

export default function JejuTimeTrendingProducts({ products }: Props) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
        <h3 className="text-xl font-baskerville font-black text-blue-950">Discover More</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((article: any) => (
          <Link
            key={article.id}
            href={`/article/${article.slug || article.id}`}
            className="group flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative w-16 h-16 overflow-hidden shrink-0 bg-slate-100">
              <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="80px" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                {article.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
