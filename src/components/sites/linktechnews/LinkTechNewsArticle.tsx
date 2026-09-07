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
import { SectionLabel } from "../technews-shared/parts";

export default function LinkTechNewsArticle({
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
        <div className="h-4 border-b border-[var(--tn-rule)]" />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="h-6 w-40 bg-[var(--tn-accent-soft)]" />
              <div className="h-12 w-full bg-[var(--tn-accent-soft)]" />
              <div className="h-12 w-4/5 bg-[var(--tn-accent-soft)]" />
              <div className="h-7 w-full bg-[var(--tn-accent-soft)]/60" />
            </div>
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] w-full bg-[var(--tn-accent-soft)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div
        style={vars}
        className="flex items-center justify-center py-32 px-6 bg-[var(--tn-bg)] min-h-[60vh]"
      >
        <div className="text-center max-w-md">
          <p className="text-[var(--tn-ink)] font-black mb-2 uppercase tracking-[0.18em] font-mono">
            Content unavailable
          </p>
          <p className="text-[var(--tn-muted)] mb-6">
            We couldn&apos;t load this article. Please try again or return to the main feed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--tn-accent-ink)] bg-[var(--tn-ink)] px-6 py-3 hover:opacity-90 transition-opacity font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);
  const trendingArticles = [...otherArticles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  const createdAt =
    article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate =
    createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase() +
    " " +
    createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase();

  function normalizeContent(html: string): string {
    if (!html) return "";
    const hasBlockTags = /<(p|div|h[1-6]|ul|ol|blockquote|section|article)\b/i.test(html);
    if (hasBlockTags) return html;
    return html
      .split(/\n{2,}/)
      .map((para) => para.trim())
      .filter(Boolean)
      .map((para) => `<p>${para.replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  function splitHtmlAtMidpoint(html: string): [string, string] {
    if (!html) return ["", ""];
    const mid = Math.floor(html.length / 2);
    const idx = html.indexOf("</p>", mid);
    if (idx === -1) return [html, ""];
    return [html.slice(0, idx + 4), html.slice(idx + 4)];
  }

  function injectLedeStyle(html: string): string {
    if (!html.trim()) return html;
    return html.replace(
      /^(\s*(?:<[^>]+>\s*)*)(\S+(?:\s+\S+){0,3})/,
      (_, prefix, words) =>
        `${prefix}<strong class="font-mono font-bold uppercase tracking-wide text-[var(--tn-ink)] mr-2 text-[18px]">${words}</strong>`,
    );
  }

  const rawHtml = normalizeContent(article.content || "");
  const [firstHtml, secondHtml] = splitHtmlAtMidpoint(rawHtml);
  const firstHtmlWithLede = injectLedeStyle(firstHtml);
  const plainWords = rawHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  const excerptText = plainWords.slice(0, 25).join(" ") + (plainWords.length > 25 ? "…" : "");

  return (
    <div style={vars} className="bg-[var(--tn-bg)] min-h-screen font-sans pb-20 text-[var(--tn-ink)]">
      <div className="h-4 border-b border-[var(--tn-rule)]" />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mb-7 font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
              <span className="bg-[var(--tn-ink)] text-[var(--tn-bg)] px-3 py-1.5 leading-none">
                By {theme.byline}
              </span>
              <span className="text-[var(--tn-ink)]">
                {normalizeCategoryName(article.category?.categoryName) || "Tech News"}
              </span>
              <span className="text-[var(--tn-muted)]">{formattedDate}</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.6rem] font-black leading-[1.02] tracking-tight mb-7">
              {article.title}
            </h1>

            <p className="text-xl text-[var(--tn-muted)] leading-snug">{excerptText}</p>
          </div>

          <div className="lg:col-span-7">
            <div
              className="relative aspect-[4/3] w-full bg-[var(--tn-accent-soft)] overflow-hidden"
              style={{ borderRadius: "var(--tn-radius)" }}
            >
              <StoryImage
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            </div>
            <div className="mt-3 border-b border-[var(--tn-rule)] pb-3">
              <p className="font-mono text-[9px] font-bold text-[var(--tn-muted)] uppercase tracking-[0.16em] text-right">
                Photograph: {theme.byline}
              </p>
            </div>
          </div>
        </div>
      </div>

      {ad && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="hidden sm:flex justify-center">
            <AdsterraBanner bannerKey={ad["468x60"] || ad["728x90"]} width={468} height={60} />
          </div>
          <div className="flex justify-center sm:hidden">
            <AdsterraBanner bannerKey={ad["320x50"]} width={320} height={50} />
          </div>
        </div>
      )}

      <div className="border-t border-[var(--tn-rule)] pt-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-8 lg:pr-8">
              <div
                className="prose max-w-none text-lg lg:text-[21px] leading-[1.8] text-[var(--tn-ink)] font-serif article-body [&_p]:mb-6"
                dangerouslySetInnerHTML={{ __html: firstHtmlWithLede }}
              />

              <ArticleImageGallery
                images={article.imageUrls ?? []}
                title={article.title}
                imageWrapperClassName="relative aspect-[4/3] bg-[var(--tn-accent-soft)] overflow-hidden"
              />

              {midArticleConfig && (
                <div className="my-10 flex justify-center border-y border-[var(--tn-rule)] py-6 bg-[var(--tn-accent-soft)]/30">
                  <AdsterraBanner
                    bannerKey={midArticleConfig.key}
                    width={midArticleConfig.width}
                    height={midArticleConfig.height}
                    className="!my-0"
                  />
                </div>
              )}

              {secondHtml && (
                <div
                  className="prose max-w-none text-lg lg:text-[21px] leading-[1.8] text-[var(--tn-ink)] font-serif article-body [&_p]:mb-6"
                  dangerouslySetInnerHTML={{ __html: secondHtml }}
                />
              )}

              <ArticleShare site="linktechnews" title={article.title} className="mt-16" />
            </div>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 flex flex-col gap-8">
                {ad?.["300x250"] && (
                  <div className="flex justify-center">
                    <AdsterraBanner bannerKey={ad["300x250"]} width={300} height={250} className="!my-0" />
                  </div>
                )}

                <div>
                  <div className="border-t-2 border-[var(--tn-ink)] pt-3 mb-6">
                    <SectionLabel theme={theme}>Most Read</SectionLabel>
                  </div>
                  <div className="flex flex-col gap-5">
                    {trendingArticles.map((a) => (
                      <Link
                        href={`/article/${a.slug || a.id}`}
                        key={a.id}
                        className="grid grid-cols-[76px_1fr] gap-3 border-b border-[var(--tn-rule)] pb-5 group items-start last:border-b-0 last:pb-0"
                      >
                        <div
                          className="relative w-[76px] h-[76px] bg-[var(--tn-accent-soft)] shrink-0 overflow-hidden"
                          style={{ borderRadius: "var(--tn-radius)" }}
                        >
                          <StoryImage
                            src={a.imageUrl}
                            alt={a.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="76px"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] font-bold text-[var(--tn-muted)] uppercase tracking-[0.16em] mb-1 block leading-none">
                            {normalizeCategoryName(a.category?.categoryName) || "News"}
                          </span>
                          <h4 className="font-serif text-[15px] font-bold text-[var(--tn-ink)] leading-tight group-hover:text-[var(--tn-accent)] transition-colors">
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
