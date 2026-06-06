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
  headline: ArticleRow;
  secondaryArticles: ArticleRow[];
}

function articleHref(a: { slug?: string | null; id: string }) {
  return `/article/${a.slug || a.id}`;
}

function excerpt(text: string | null | undefined, max = 200) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

export default function LavagueTechFeaturedSection({ headline, secondaryArticles }: Props) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">

      {/* Main headline — 8 cols */}
      <Link href={articleHref(headline)} className="lg:col-span-8 group relative block bg-gray-200 overflow-hidden min-h-[380px]">
        <StoryImage
          src={headline.imageUrl}
          alt={headline.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 1024px) 100vw, 67vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 w-full">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-300 mb-3">
            <span className="w-5 h-px bg-blue-300 inline-block" />
            {headline.category?.categoryName ?? "Tech"}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-black text-white leading-tight group-hover:text-blue-200 transition-colors mb-3">
            {headline.title}
          </h1>
          <p className="text-[13px] text-gray-300 leading-relaxed line-clamp-2">
            {excerpt(headline.content)}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-[11px] text-gray-300 font-medium">
              {new Date(headline.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-blue-300 text-sm font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </Link>

      {/* Secondary stack — 4 cols */}
      <div className="lg:col-span-4 grid grid-rows-2 gap-4">
        {secondaryArticles.slice(0, 2).map((article) => (
          <Link key={article.id} href={articleHref(article)} className="group relative block bg-gray-200 overflow-hidden min-h-[180px]">
            <StoryImage
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 w-full">
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 block mb-1">
                {article.category?.categoryName ?? "Tech"}
              </span>
              <h3 className="text-[15px] font-bold text-white leading-snug group-hover:text-blue-200 transition-colors line-clamp-2">
                {article.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
