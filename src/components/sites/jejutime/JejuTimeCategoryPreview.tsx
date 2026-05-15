"use client";

import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";

interface CategoryData {
  name: string;
  articles: any[];
}

interface Props {
  categories: CategoryData[];
}

export default function JejuTimeCategoryPreview({ categories }: Props) {
  if (!categories || categories.length === 0) return null;

  // Split categories for the requested layout: 3, 3, 2 (Total 8 if possible)
  const row1 = categories.slice(0, 3);
  const row2 = categories.slice(3, 6);
  const row3 = categories.slice(6, 8);

  const renderCategory = (cat: CategoryData, index: number) => (
    <div key={cat.name} className="flex flex-col">
      <div className="border-t-[3px] border-slate-900 pt-2 mb-5">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
          {cat.name}
        </h3>
      </div>
      <div className="flex flex-col gap-5">
        {cat.articles.map((article, i) => {
          if (i === 0) {
            return (
              <Link
                key={article.id}
                href={`/article/${article.slug || article.id}`}
                className="group block"
              >
                <div className="relative aspect-[16/10] overflow-hidden mb-3 bg-slate-100 shadow-sm">
                  <StoryImage
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="400px"
                  />
                </div>
                <h4 className="text-[18px] font-black leading-tight group-hover:text-blue-600 transition-colors mb-2 text-slate-900 tracking-tight font-sans">
                  {article.title}
                </h4>
                <p className="text-slate-600 text-[12px] line-clamp-2 leading-relaxed font-light mb-2">
                  {article.content}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="text-blue-600/70">JejuTime</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span>{((i + index) % 12) + 1}h ago</span>
                </div>
              </Link>
            );
          }
          return (
            <Link
              key={article.id}
              href={`/article/${article.slug || article.id}`}
              className="group flex gap-3 pt-5 border-t border-slate-100 items-start"
            >
              <div className="relative w-16 h-16 shrink-0 overflow-hidden bg-slate-100 shadow-sm">
                <StoryImage
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="64px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold leading-snug group-hover:text-blue-600 transition-colors text-slate-900 tracking-tight font-sans mb-1 line-clamp-2">
                  {article.title}
                </h4>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {((i + index) * 2) % 24}h ago
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="mt-12 mb-16">
      {/* Rows 1 & 2: 3 Columns Each */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 mb-12">
        {row1.map((cat, i) => renderCategory(cat, i))}
        {row2.map((cat, i) => renderCategory(cat, i + 3))}
      </div>

      {/* Row 3: 2 Columns Stretched */}
      {row3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
          {row3.map((cat, i) => renderCategory(cat, i + 6))}
        </div>
      )}
    </section>
  );
}
