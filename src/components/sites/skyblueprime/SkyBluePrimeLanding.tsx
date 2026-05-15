"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, TrendingUp, Sparkles } from "lucide-react";
import { StoryImage } from "@/components/StoryImage";

const AdBanner = dynamic(() => import("@/components/AdBanner").then((m) => m.AdBanner), {
  ssr: true,
  loading: () => (
    <div className="h-[100px] animate-pulse bg-sky-50 rounded-xl border border-sky-100" />
  ),
});

interface ArticleRow {
  id: string;
  slug?: string | null;
  title: string;
  content?: string | null;
  imageUrl?: string | null;
  createdAt: string | Date;
  trendingScore?: number | null;
  category?: { categoryName?: string | null } | null;
}

interface Props {
  tenantId: string | null;
  articles: ArticleRow[];
  banners: {
    top: unknown[];
    sidebar: unknown[];
    footer: unknown[];
  };
}

function articleHref(article: { slug?: string | null; id: string }) {
  return `/article/${article.slug || article.id}`;
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function excerpt(text: string | null | undefined, max = 120) {
  if (!text) return "";
  const plain = text.replace(/<[^>]+>/g, "").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

export default function SkyBluePrimeLanding({ articles, banners }: Props) {
  const sorted = [...articles].sort((a, b) => {
    if ((b.trendingScore ?? 0) !== (a.trendingScore ?? 0)) {
      return (b.trendingScore ?? 0) - (a.trendingScore ?? 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const hero = sorted[0];
  const heroSide = sorted.slice(1, 3);
  const featured = sorted.slice(3, 7);
  const trending = sorted.slice(0, 8);
  const latest = sorted.slice(3, 15);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <AdBanner position="HOME_TOP" initialBanners={banners.top as never[]} />
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-sky-500" size={18} />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
            Today&apos;s spotlight
          </span>
        </div>

        {hero ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <Link
              href={articleHref(hero)}
              className="lg:col-span-8 group relative overflow-hidden rounded-2xl bg-sky-950 shadow-xl shadow-sky-200/50 min-h-[320px] sm:min-h-[400px]"
            >
              <StoryImage
                src={hero.imageUrl}
                alt={hero.title}
                fill
                className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sky-950 via-sky-950/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                {hero.category?.categoryName && (
                  <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest bg-sky-500 text-white rounded-full">
                    {hero.category.categoryName}
                  </span>
                )}
                <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight group-hover:underline decoration-sky-400 underline-offset-4">
                  {hero.title}
                </h1>
                <p className="mt-3 text-sm sm:text-base text-sky-100/90 line-clamp-2 max-w-2xl">
                  {excerpt(hero.content, 160)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-sky-300">
                  Read story <ChevronRight size={14} />
                </span>
              </div>
            </Link>

            <div className="lg:col-span-4 flex flex-col gap-4">
              {heroSide.map((article) => (
                <Link
                  key={article.id}
                  href={articleHref(article)}
                  className="group flex gap-4 p-4 rounded-xl bg-white border border-sky-100 shadow-sm hover:shadow-md hover:border-sky-200 transition-all flex-1"
                >
                  <div className="relative w-28 h-24 sm:w-32 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-sky-100">
                    <StoryImage
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="128px"
                    />
                  </div>
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500 mb-1">
                      {article.category?.categoryName ?? "News"}
                    </span>
                    <h2 className="text-sm font-semibold text-sky-950 line-clamp-3 group-hover:text-sky-600 transition-colors">
                      {article.title}
                    </h2>
                    <time className="mt-2 text-[11px] text-sky-400">{formatDate(article.createdAt)}</time>
                  </div>
                </Link>
              ))}
              {heroSide.length === 0 && (
                <div className="flex-1 rounded-xl border border-dashed border-sky-200 bg-sky-50/50 flex items-center justify-center text-sm text-sky-400 p-8">
                  More stories coming soon
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-white p-16 text-center">
            <p className="text-sky-600 font-medium">No published articles yet.</p>
            <p className="text-sm text-sky-400 mt-2">Check back soon for the latest from Sky Blue Prime.</p>
          </div>
        )}
      </section>

      {/* Featured grid */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="flex items-end justify-between mb-6 border-b border-sky-100 pb-4">
            <h2 className="text-lg font-bold text-sky-950">Featured</h2>
            <Link href="/search" className="text-xs font-semibold uppercase tracking-wider text-sky-600 hover:text-sky-800 flex items-center gap-0.5">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((article) => (
              <Link
                key={article.id}
                href={articleHref(article)}
                className="group block rounded-xl overflow-hidden bg-white border border-sky-100 hover:shadow-lg hover:border-sky-200 transition-all"
              >
                <div className="relative aspect-[4/3] bg-sky-100">
                  <StoryImage
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                    {article.category?.categoryName ?? "News"}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold text-sky-950 line-clamp-2 group-hover:text-sky-600">
                    {article.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest + Trending */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-sky-950 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-sky-500 rounded-full" />
              Latest stories
            </h2>
            <div className="space-y-4">
              {latest.length > 0 ? (
                latest.map((article) => (
                  <Link
                    key={article.id}
                    href={articleHref(article)}
                    className="group flex gap-4 p-4 rounded-xl bg-white border border-sky-50 hover:border-sky-200 hover:shadow-sm transition-all"
                  >
                    <div className="relative w-24 h-20 sm:w-32 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-sky-100">
                      <StoryImage
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                        {article.category?.categoryName ?? "News"}
                      </span>
                      <h3 className="text-base font-semibold text-sky-950 mt-0.5 line-clamp-2 group-hover:text-sky-600">
                        {article.title}
                      </h3>
                      <p className="text-xs text-sky-500/80 mt-1 line-clamp-1">{excerpt(article.content, 80)}</p>
                      <time className="text-[11px] text-sky-400 mt-2 block">{formatDate(article.createdAt)}</time>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-sky-500 py-8 text-center rounded-xl bg-sky-50">No stories to show.</p>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl bg-white border border-sky-100 p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-sky-950 mb-4">
                <TrendingUp size={16} className="text-sky-500" />
                Trending
              </h3>
              <ol className="space-y-4">
                {trending.map((article, i) => (
                  <li key={article.id}>
                    <Link href={articleHref(article)} className="group flex gap-3 items-start">
                      <span className="text-2xl font-bold text-sky-200 tabular-nums leading-none w-7">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className="text-sm font-medium text-sky-900 line-clamp-2 group-hover:text-sky-600">
                          {article.title}
                        </h4>
                        <time className="text-[10px] text-sky-400 mt-1 block">{formatDate(article.createdAt)}</time>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
            <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar as never[]} />
          </aside>
        </div>
      </section>
    </div>
  );
}
