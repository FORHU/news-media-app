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
import { getTechNewsTheme, techNewsVars } from "../technews-shared/theme";

export default function TechyGateArticle({
  domain,
  articleId,
  initialOtherArticles = [],
}: {
  domain: string;
  articleId: string;
  initialOtherArticles?: Article[];
}) {
  const router = useRouter();
  const theme = getTechNewsTheme(domain);

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

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  if (!theme) return null;
  const ad = ADSTERRA_CONFIG[theme.key]?.banners;
  const midArticleConfig = ADSTERRA_CONFIG[theme.key]?.midArticle;
  const vars = techNewsVars(theme);

  if (isLoading) {
    return (
      <div style={vars} className="bg-[var(--tn-bg)] min-h-screen animate-pulse pb-20">
        <div className="bg-[var(--tn-ink)] h-[220px]" />
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 mt-10 space-y-5">
          <div className="aspect-[16/9] w-full bg-[var(--tn-accent-soft)] border-4 border-[var(--tn-ink)]" />
          <div className="h-4 w-full bg-[var(--tn-accent-soft)]" />
          <div className="h-4 w-4/5 bg-[var(--tn-accent-soft)]" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div style={vars} className="flex items-center justify-center py-32 px-6 bg-[var(--tn-bg)] min-h-[60vh]">
        <div className="text-center max-w-md border-4 border-[var(--tn-ink)] p-10">
          <p className="font-serif text-2xl font-bold uppercase text-[var(--tn-ink)] mb-3">Gate jammed.</p>
          <p className="text-[var(--tn-muted)] mb-6">Couldn&apos;t load this story. Try again or head back.</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--tn-accent-ink)] bg-[var(--tn-accent)] px-6 py-3 hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);
  const fastLane = [...otherArticles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) return (b.trendingScore || 0) - (a.trendingScore || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  const createdAt = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate =
    createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
  const category = normalizeCategoryName(article.category?.categoryName) || "Tech";

  function normalizeContent(html: string): string {
    if (!html) return "";
    const hasBlockTags = /<(p|div|h[1-6]|ul|ol|blockquote|section|article)\b/i.test(html);
    if (hasBlockTags) return html;
    return html
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
      .join("");
  }
  function splitHtmlAtMidpoint(html: string): [string, string] {
    if (!html) return ["", ""];
    const mid = Math.floor(html.length / 2);
    const idx = html.indexOf("</p>", mid);
    if (idx === -1) return [html, ""];
    return [html.slice(0, idx + 4), html.slice(idx + 4)];
  }

  const rawHtml = normalizeContent(article.content || "");
  const [firstHtml, secondHtml] = splitHtmlAtMidpoint(rawHtml);
  const plainWords = rawHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  const excerptText = plainWords.slice(0, 28).join(" ") + (plainWords.length > 28 ? "…" : "");

  return (
    <div style={vars} className="bg-[var(--tn-bg)] min-h-screen pb-20 text-[var(--tn-ink)] font-sans">
      {/* Black masthead block */}
      <div className="bg-[var(--tn-ink)] text-[var(--tn-bg)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tn-bg)]/70 hover:text-[var(--tn-bg)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="inline-block bg-[var(--tn-accent)] text-[var(--tn-accent-ink)] text-[11px] font-bold uppercase tracking-[0.18em] px-3 py-1.5 mb-4">
            {category}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.8rem] font-bold uppercase leading-[1.0] tracking-tight max-w-[22ch]">
            {article.title}
          </h1>
          <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--tn-bg)]/60 flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-[var(--tn-bg)]">By {theme.byline}</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        {article.imageUrl && (
          <div className="relative -mt-0 pt-8">
            <div className="flex items-stretch">
              <span className="w-[6px] bg-[var(--tn-accent)] shrink-0" aria-hidden />
              <div className="relative aspect-[16/9] flex-1 bg-[var(--tn-accent-soft)] overflow-hidden border-y-4 border-[var(--tn-ink)]">
                <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" priority sizes="(max-width: 1100px) 100vw, 1040px" />
              </div>
              <span className="w-[6px] bg-[var(--tn-accent)] shrink-0" aria-hidden />
            </div>
          </div>
        )}

        <p className="text-xl sm:text-2xl font-bold leading-snug text-[var(--tn-ink)] mt-8 mb-10 max-w-[62ch]">
          {excerptText}
        </p>

        {ad && (
          <div className="mb-10 flex justify-center border-y-2 border-[var(--tn-ink)] py-5">
            <AdsterraBanner bannerKey={ad["468x60"] || ad["728x90"]} width={468} height={60} className="!my-0" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-8">
            <div className="border-2 border-[var(--tn-ink)] p-6 sm:p-8">
              <div
                className="prose max-w-none text-[17px] lg:text-[19px] leading-[1.8] text-[var(--tn-ink)] article-body [&_p]:mb-6 [&_h2]:font-serif [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-[1.5rem] [&_h2]:tracking-tight [&_h2]:mt-9"
                dangerouslySetInnerHTML={{ __html: firstHtml }}
              />

              <ArticleImageGallery
                images={article.imageUrls ?? []}
                title={article.title}
                imageWrapperClassName="relative aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden border-2 border-[var(--tn-ink)] my-8"
              />

              {midArticleConfig && (
                <div className="my-9 flex justify-center border-y-2 border-[var(--tn-ink)] py-5">
                  <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
                </div>
              )}

              {secondHtml && (
                <div
                  className="prose max-w-none text-[17px] lg:text-[19px] leading-[1.8] text-[var(--tn-ink)] article-body [&_p]:mb-6"
                  dangerouslySetInnerHTML={{ __html: secondHtml }}
                />
              )}
            </div>

            <ArticleShare site="techygate" title={article.title} className="mt-12" />
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-8">
              {ad?.["300x250"] && (
                <div className="flex justify-center">
                  <AdsterraBanner bannerKey={ad["300x250"]} width={300} height={250} className="!my-0" />
                </div>
              )}
              <div className="border-2 border-[var(--tn-ink)]">
                <div className="flex items-stretch">
                  <span className="w-[6px] bg-[var(--tn-accent)] shrink-0" aria-hidden />
                  <h3 className="bg-[var(--tn-ink)] text-[var(--tn-bg)] font-serif text-sm font-bold uppercase tracking-[0.1em] px-4 py-2.5 flex-1">
                    Fast Lane
                  </h3>
                </div>
                <ol className="divide-y-2 divide-[var(--tn-rule)]">
                  {fastLane.map((a, i) => (
                    <Link key={a.id} href={`/article/${a.slug || a.id}`} className="group flex gap-3 items-start p-4 hover:bg-[var(--tn-accent-soft)]/60 transition-colors">
                      <span className="font-serif text-[20px] font-bold text-[var(--tn-rule)] group-hover:text-[var(--tn-accent)] transition-colors tabular-nums shrink-0 leading-none">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--tn-accent)] block mb-1">
                          {normalizeCategoryName(a.category?.categoryName) || "Tech"}
                        </span>
                        <h4 className="font-serif text-[14px] font-bold uppercase text-[var(--tn-ink)] leading-[1.12] group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">
                          {a.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </ol>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
