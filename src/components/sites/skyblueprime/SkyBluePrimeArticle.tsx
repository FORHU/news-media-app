"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StoryImage } from "@/components/StoryImage";
import { articlesApi } from "@/lib/api";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import type { Article } from "@/lib/types";
import { ArticleShare } from "@/components/article/ArticleShare";
import { ArticleImageGallery } from "@/components/article/ArticleImageGallery";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";

const tenantConfig = ADSTERRA_CONFIG.skyblueprime;
const adKeys = tenantConfig.banners;

export default function SkyBluePrimeArticle({
  articleId,
  initialOtherArticles = [],
}: {
  articleId: string;
  initialOtherArticles?: Article[];
}) {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);

    const lastViewed = localStorage.getItem(`viewed_${articleId}`);
    const now = Date.now();
    const lockTime = 30 * 60 * 1000;

    if (!lastViewed || now - parseInt(lastViewed) > lockTime) {
      articlesApi.recordView(articleId).catch(console.error);
      localStorage.setItem(`viewed_${articleId}`, now.toString());
    }
  }, [articleId]);

  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  const allArticles = initialOtherArticles;

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen animate-pulse pb-20">
        <div className="h-4 bg-white border-b border-sky-100" />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="flex gap-3">
                <div className="h-6 w-36 bg-sky-950/10 rounded" />
                <div className="h-6 w-28 bg-sky-100 rounded" />
              </div>
              <div className="h-12 w-full bg-sky-100 rounded" />
              <div className="h-12 w-4/5 bg-sky-100 rounded" />
              <div className="h-7 w-full bg-sky-50 rounded" />
              <div className="h-7 w-3/4 bg-sky-50 rounded" />
            </div>
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] w-full bg-sky-100 rounded" />
              <div className="mt-3 h-3 w-48 bg-sky-50 rounded ml-auto" />
            </div>
          </div>
        </div>
        <div className="border-t border-sky-100 pt-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              <div className="lg:col-span-8 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`h-5 bg-sky-100 rounded ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
                ))}
              </div>
              <div className="lg:col-span-4">
                <div className="h-[250px] w-full bg-sky-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="flex items-center justify-center py-32 px-6 bg-white min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-sky-950 font-black mb-2 uppercase tracking-widest">
            Content Unavailable
          </p>
          <p className="text-sky-800 mb-6 font-medium">
            We couldn't load this article. Please try again or return to the main feed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white bg-sky-950 px-6 py-3 hover:bg-sky-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const otherArticles = allArticles.filter((a) => a.id !== article.id);

  const trendingArticles = [...otherArticles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  const createdAt =
    article.createdAt instanceof Date
      ? article.createdAt
      : new Date(article.createdAt as string);

  const formattedDate =
    createdAt
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase() +
    " " +
    createdAt
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
      .toUpperCase();

  // Split HTML at the nearest </p> boundary after the midpoint so the mid-article
  // ad always falls between complete paragraphs, preserving all formatting.
  function splitHtmlAtMidpoint(html: string): [string, string] {
    if (!html) return ["", ""];
    const mid = Math.floor(html.length / 2);
    const idx = html.indexOf("</p>", mid);
    if (idx === -1) return [html, ""];
    return [html.slice(0, idx + 4), html.slice(idx + 4)];
  }

  // Inject bold dropcap on the first 4 words of the HTML body.
  function injectLedeStyle(html: string): string {
    if (!html.trim()) return html;
    return html.replace(
      /^(\s*(?:<[^>]+>\s*)*)(\S+(?:\s+\S+){0,3})/,
      (_, prefix, words) =>
        `${prefix}<strong class="font-sans font-black uppercase tracking-wide text-sky-950 mr-2 text-[20px]">${words}</strong>`
    );
  }

  // If content is plain text (no HTML tags), wrap each paragraph in <p> tags
  // so the browser renders paragraph breaks correctly.
  function normalizeContent(text: string): string {
    if (!text) return "";
    if (/<[a-z][\s\S]*>/i.test(text)) return text;
    return text
      .split(/\n\n+/)
      .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  const rawHtml = normalizeContent(article.content || "");
  const [firstHtml, secondHtml] = splitHtmlAtMidpoint(rawHtml);
  const firstHtmlWithLede = injectLedeStyle(firstHtml);

  const plainWords = rawHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  const excerptText = plainWords.slice(0, 25).join(" ") + (plainWords.length > 25 ? "..." : "");

  const midArticleConfig = tenantConfig.midArticle;

  return (
    <div className="bg-white min-h-screen font-sans pb-20">

      {/* Spacing to separate from Global Header Nav */}
      <div className="h-4 bg-white border-b border-sky-100" />

      {/* Article Hero */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">

          {/* Left Column: Meta & Title */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-3 mb-8">
              <div className="bg-sky-950 text-white px-3 py-1.5 text-[11px] font-black uppercase tracking-widest leading-none">
                BY SKY BLUE PRIME
              </div>
              <span className="text-sky-950 text-[11px] font-black uppercase tracking-widest">
                {normalizeCategoryName(article.category?.categoryName) || "TECH NEWS"}
              </span>
              <span className="text-sky-950 text-[11px] font-black uppercase tracking-widest">
                {formattedDate}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4rem] font-black text-sky-950 leading-[1.0] tracking-tight mb-8">
              {article.title}
            </h1>

            <p className="text-xl sm:text-2xl text-sky-800/90 leading-snug font-medium">
              {excerptText}
            </p>
          </div>

          {/* Right Column: Main Image */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] w-full bg-sky-100 overflow-hidden">
              <StoryImage
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </div>
            <div className="mt-3 border-b border-sky-100 pb-3">
              <p className="text-[9px] font-bold text-sky-950 uppercase tracking-widest text-right">
                PHOTOGRAPH: SKY BLUE PRIME / AP PHOTO
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Banner */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="hidden sm:flex justify-center">
          <AdsterraBanner bannerKey={adKeys["468x60"]} width={468} height={60} />
        </div>
        <div className="flex justify-center sm:hidden">
          <AdsterraBanner bannerKey={adKeys["320x50"]} width={320} height={50} />
        </div>
      </div>

      {/* Article Content & Sidebar */}
      <div className="border-t-[1px] border-sky-100 pt-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

            {/* Main Content */}
            <div className="lg:col-span-8 lg:pr-8">
              {/* First half — dropcap bold injected on first 4 words */}
              <div
                className="prose prose-sky max-w-none text-lg lg:text-[21px] leading-[1.8] text-sky-950 font-serif article-body [&_p]:mb-6"
                dangerouslySetInnerHTML={{ __html: firstHtmlWithLede }}
              />

              <ArticleImageGallery
                images={article.imageUrls ?? []}
                title={article.title}
                imageWrapperClassName="relative aspect-[4/3] bg-sky-100 overflow-hidden"
              />

              {/* Mid-article Banner */}
              {midArticleConfig && (
                <div className="my-10 flex justify-center border-y border-sky-100 py-6 bg-sky-50/30">
                  <AdsterraBanner
                    bannerKey={midArticleConfig.key}
                    width={midArticleConfig.width}
                    height={midArticleConfig.height}
                    className="!my-0"
                  />
                </div>
              )}

              {/* Second half */}
              {secondHtml && (
                <div
                  className="prose prose-sky max-w-none text-lg lg:text-[21px] leading-[1.8] text-sky-950 font-serif article-body [&_p]:mb-6"
                  dangerouslySetInnerHTML={{ __html: secondHtml }}
                />
              )}

              {/* Article Share */}
              <ArticleShare site="skyblueprime" title={article.title} className="mt-16" />
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 flex flex-col gap-8">
                {/* Top 300x250 Ad */}
                <div className="flex justify-center">
                  <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} className="!my-0" />
                </div>

                {/* Most Popular */}
                <div>
                  <div className="border-t-[4px] border-sky-950 pt-3 mb-6">
                    <h3 className="text-[13px] font-black text-sky-950 uppercase tracking-widest">Most Popular</h3>
                  </div>
                  <div className="flex flex-col gap-5">
                    {trendingArticles.map((a) => (
                      <Link
                        href={`/article/${a.slug || a.id}`}
                        key={a.id}
                        className="grid grid-cols-[80px_1fr] gap-3 border-b border-sky-100 pb-5 group items-start last:border-b-0 last:pb-0"
                      >
                        <div className="relative w-[80px] h-[80px] bg-sky-100 shrink-0 overflow-hidden">
                          <StoryImage
                            src={a.imageUrl}
                            alt={a.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="80px"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1 block leading-none">
                            {normalizeCategoryName(a.category?.categoryName) || "News"}
                          </span>
                          <h4 className="text-[15px] font-bold text-sky-950 leading-tight group-hover:text-sky-600 transition-colors">
                            {a.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
