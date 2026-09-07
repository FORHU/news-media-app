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

export default function NewYorkSignalArticle({
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
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-12 space-y-5">
          <div className="h-3 w-48 bg-[var(--tn-accent-soft)]" />
          <div className="h-12 w-full bg-[var(--tn-accent-soft)]" />
          <div className="h-12 w-3/4 bg-[var(--tn-accent-soft)]" />
          <div className="aspect-[3/2] w-full bg-[var(--tn-accent-soft)] mt-6" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div style={vars} className="flex items-center justify-center py-32 px-6 bg-[var(--tn-bg)] min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="font-serif text-2xl font-black text-[var(--tn-ink)] mb-3">Story off the wire.</p>
          <p className="text-[var(--tn-muted)] mb-6">We couldn&apos;t load this dispatch. Try again shortly.</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tn-accent-ink)] bg-[var(--tn-accent)] px-6 py-3 hover:opacity-90 transition-opacity font-mono"
          >
            <ArrowLeft className="w-4 h-4" /> Back to front page
          </button>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);
  const mostRead = [...otherArticles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) return (b.trendingScore || 0) - (a.trendingScore || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  const createdAt = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate = createdAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const category = normalizeCategoryName(article.category?.categoryName) || "Dispatch";

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
  function injectDropCap(html: string): string {
    if (!html.trim()) return html;
    return html.replace(
      /^(\s*(?:<[^>]+>\s*)*)(\S)/,
      (_, prefix, letter) =>
        `${prefix}<span class="float-left font-serif font-black text-[58px] leading-[0.82] mr-2.5 mt-1 text-[var(--tn-ink)]">${letter}</span>`,
    );
  }

  const rawHtml = normalizeContent(article.content || "");
  const [firstHtml, secondHtml] = splitHtmlAtMidpoint(rawHtml);
  const firstHtmlWithCap = injectDropCap(firstHtml);
  const plainWords = rawHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  const standfirst = plainWords.slice(0, 34).join(" ") + (plainWords.length > 34 ? "…" : "");

  return (
    <div style={vars} className="bg-[var(--tn-bg)] min-h-screen pb-20 text-[var(--tn-ink)] font-sans">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dateline */}
        <div className="flex items-center gap-3 pt-8 pb-3 border-b border-[var(--tn-ink)] font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--tn-muted)]">
          <span className="text-[var(--tn-accent)] font-bold">New York</span>
          <span className="w-1 h-1 bg-[var(--tn-rule)]" />
          <span>{formattedDate}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pt-10">
          <div className="lg:col-span-8">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--tn-accent)]">{category}</span>
            <h1 className="font-serif text-[2.6rem] sm:text-5xl lg:text-[3.6rem] font-black leading-[1.03] tracking-tight mt-3 mb-5">
              {article.title}
            </h1>
            <p className="font-serif text-xl sm:text-[1.4rem] leading-[1.5] text-[var(--tn-muted)] mb-6">
              {standfirst}
            </p>
            <div className="flex items-center gap-3 py-3 border-y border-[var(--tn-rule)] text-[11px] uppercase tracking-[0.18em] text-[var(--tn-muted)]">
              <span className="text-[var(--tn-ink)] font-semibold">By {theme.byline}</span>
            </div>

            {article.imageUrl && (
              <figure className="mt-8">
                <div className="relative aspect-[3/2] w-full bg-[var(--tn-accent-soft)] overflow-hidden">
                  <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" priority sizes="(max-width: 1024px) 100vw, 720px" />
                </div>
                <figcaption className="font-serif italic text-[13px] text-[var(--tn-muted)] mt-2 pb-3 border-b border-[var(--tn-rule)]">
                  {article.title} — {theme.byline}
                </figcaption>
              </figure>
            )}

            {ad && (
              <div className="my-10 flex justify-center border-y border-[var(--tn-rule)] py-5">
                <AdsterraBanner bannerKey={ad["468x60"] || ad["728x90"]} width={468} height={60} className="!my-0" />
              </div>
            )}

            <div
              className="prose max-w-none text-[18px] lg:text-[19px] leading-[1.78] text-[var(--tn-ink)] font-serif article-body mt-8 [&_p]:mb-6 [&_h2]:font-serif [&_h2]:font-black [&_h2]:text-[1.6rem] [&_h2]:mt-10"
              dangerouslySetInnerHTML={{ __html: firstHtmlWithCap }}
            />

            <ArticleImageGallery
              images={article.imageUrls ?? []}
              title={article.title}
              imageWrapperClassName="relative aspect-[3/2] bg-[var(--tn-accent-soft)] overflow-hidden my-8"
            />

            {midArticleConfig && (
              <div className="my-10 flex justify-center border-y border-[var(--tn-rule)] py-6">
                <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
              </div>
            )}

            {secondHtml && (
              <div
                className="prose max-w-none text-[18px] lg:text-[19px] leading-[1.78] text-[var(--tn-ink)] font-serif article-body [&_p]:mb-6"
                dangerouslySetInnerHTML={{ __html: secondHtml }}
              />
            )}

            <ArticleShare site="newyorksignal" title={article.title} className="mt-14" />
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-8">
              {ad?.["300x250"] && (
                <div className="flex justify-center">
                  <AdsterraBanner bannerKey={ad["300x250"]} width={300} height={250} className="!my-0" />
                </div>
              )}
              <div className="bg-[var(--tn-ink)] text-white p-6">
                <h3 className="font-serif text-base font-black uppercase tracking-widest border-b border-white/20 pb-4 mb-5 flex items-center gap-2">
                  Most Read <span className="w-2 h-2 bg-[var(--tn-accent)]" />
                </h3>
                <ol className="flex flex-col divide-y divide-white/15">
                  {mostRead.map((a, i) => (
                    <Link key={a.id} href={`/article/${a.slug || a.id}`} className="group flex gap-4 py-4 first:pt-0">
                      <span className="font-serif text-2xl font-black text-white/40 group-hover:text-[var(--tn-accent)] transition-colors shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 block mb-1">
                          {normalizeCategoryName(a.category?.categoryName) || "Dispatch"}
                        </span>
                        <h4 className="text-sm font-bold leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-3">
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
