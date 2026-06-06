"use client";

import Link from "next/link";
import { StoryImage } from "@/components/StoryImage";

interface ArticleRow {
  id: string;
  slug?: string | null;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  category?: { categoryName?: string | null } | null;
}

interface Props {
  articles: ArticleRow[];
}

function articleHref(a: { slug?: string | null; id: string }) {
  return `/article/${a.slug || a.id}`;
}

function excerpt(text: string | null | undefined, max = 100) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

export default function LavagueTechTrendingProducts({ articles }: Props) {
  if (!articles.length) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-blue-600/20">
        <span className="w-1 h-6 bg-blue-700 inline-block rounded-full shrink-0" />
        <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.25em]">From the Blog</h2>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={articleHref(article)}
            className="group flex flex-col bg-white border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all overflow-hidden"
          >
            <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              <StoryImage
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                {article.category?.categoryName ?? "Blog"}
              </span>
              <h3 className="text-[14px] font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-3 flex-1">
                {article.title}
              </h3>
              <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-2">
                {excerpt(article.content)}
              </p>
              <span className="text-[10px] text-gray-400 font-medium">
                {new Date(article.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
