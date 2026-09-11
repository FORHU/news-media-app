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

export default function TechOggiArticle({
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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 mb-16">
          <div className="h-6 w-40 bg-[var(--tn-accent-soft)] rounded-full mb-6" />
          <div className="h-12 w-full bg-[var(--tn-accent-soft)] rounded-[var(--tn-radius)] mb-3" />
          <div className="h-12 w-4/5 bg-[var(--tn-accent-soft)] rounded-[var(--tn-radius)] mb-8" />
          <div className="relative aspect-[16/9] w-full bg-[var(--tn-accent-soft)] rounded-[var(--tn-radius)]" />
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
          <p className="text-[var(--tn-ink)] font-black mb-2 uppercase tracking-[0.14em]">
            Contenuto non disponibile
          </p>
          <p className="text-[var(--tn-muted)] mb-6">
            Non è stato possibile caricare questo articolo. Riprova oppure torna alla home.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--tn-accent-ink)] bg-[var(--tn-accent)] px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla home
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
  const formattedDate = createdAt.toLocaleDateString("it-IT", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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

  const bodyHtml = normalizeContent(article.content || "");

  return (
    <div style={vars} className="bg-[var(--tn-bg)] min-h-screen font-sans pb-20 text-[var(--tn-ink)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--tn-accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--tn-ink)] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--tn-accent)]" aria-hidden />
          {normalizeCategoryName(article.category?.categoryName) || "Notizie Tech"}
        </span>

        <h1 className="font-sans text-3xl sm:text-5xl font-black leading-[1.08] tracking-tight mb-5 max-w-3xl">
          {article.title}
        </h1>

        <div className="flex items-center gap-3 text-[12px] font-bold text-[var(--tn-muted)] uppercase tracking-wide mb-8">
          <span>Di {theme.byline}</span>
          <span aria-hidden>·</span>
          <span>{formattedDate}</span>
        </div>

        <div
          className="relative aspect-[16/9] w-full bg-[var(--tn-accent-soft)] overflow-hidden mb-10"
          style={{ borderRadius: "var(--tn-radius)" }}
        >
          <StoryImage
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1200px"
            priority
          />
        </div>
      </div>

      {ad && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mb-10">
          <div className="hidden sm:flex justify-center">
            <AdsterraBanner bannerKey={ad["468x60"] || ad["728x90"]} width={468} height={60} />
          </div>
          <div className="flex justify-center sm:hidden">
            <AdsterraBanner bannerKey={ad["320x50"]} width={320} height={50} />
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div
              className="prose max-w-none text-[17px] lg:text-[19px] leading-[1.8] text-[var(--tn-ink)] font-sans article-body [&_p]:mb-6"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            <ArticleImageGallery
              images={article.imageUrls ?? []}
              title={article.title}
              imageWrapperClassName="relative aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden rounded-[var(--tn-radius)]"
            />

            {midArticleConfig && (
              <div
                className="my-10 flex justify-center border border-[var(--tn-rule)] py-6 bg-[var(--tn-surface)]"
                style={{ borderRadius: "var(--tn-radius)" }}
              >
                <AdsterraBanner
                  bannerKey={midArticleConfig.key}
                  width={midArticleConfig.width}
                  height={midArticleConfig.height}
                  className="!my-0"
                />
              </div>
            )}

            <ArticleShare site="techoggi" title={article.title} className="mt-16" />
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-8">
              {ad?.["300x250"] && (
                <div className="flex justify-center">
                  <AdsterraBanner bannerKey={ad["300x250"]} width={300} height={250} className="!my-0" />
                </div>
              )}

              {trendingArticles.length > 0 && (
                <div>
                  <SectionLabel theme={theme} className="mb-5">Più Letti</SectionLabel>
                  <div className="flex flex-col gap-3">
                    {trendingArticles.map((a) => (
                      <Link
                        href={`/article/${a.slug || a.id}`}
                        key={a.id}
                        className="group flex gap-3 items-center p-2 -mx-2 rounded-[var(--tn-radius)] hover:bg-[var(--tn-accent-soft)]/40 transition-colors"
                      >
                        <div
                          className="relative w-16 h-16 bg-[var(--tn-accent-soft)] shrink-0 overflow-hidden"
                          style={{ borderRadius: "var(--tn-radius)" }}
                        >
                          <StoryImage
                            src={a.imageUrl}
                            alt={a.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-[9.5px] font-bold text-[var(--tn-accent)] uppercase tracking-[0.14em] mb-1 block leading-none">
                            {normalizeCategoryName(a.category?.categoryName) || "Notizie"}
                          </span>
                          <h4 className="font-sans text-[13.5px] font-bold text-[var(--tn-ink)] leading-tight group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
                            {a.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
