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

export default function DbTechNewsArticle({
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
      <div style={vars} className="bg-[var(--tn-bg)] min-h-screen animate-pulse pb-20 font-mono">
        <div className="h-10 border-b border-[var(--tn-rule)] bg-[var(--tn-surface)]" />
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 mt-12 space-y-5">
          <div className="h-4 w-40 bg-[var(--tn-accent-soft)]" />
          <div className="h-10 w-full bg-[var(--tn-accent-soft)]" />
          <div className="h-10 w-3/4 bg-[var(--tn-accent-soft)]" />
          <div className="aspect-[16/9] w-full bg-[var(--tn-accent-soft)]" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div style={vars} className="flex items-center justify-center py-32 px-6 bg-[var(--tn-bg)] min-h-[60vh] font-mono">
        <div className="text-center max-w-md">
          <p className="text-[var(--tn-ink)] font-bold mb-2">$ error: article not found</p>
          <p className="text-[var(--tn-muted)] mb-6 font-sans">
            We couldn&apos;t load this record. Try again or return to the feed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--tn-accent-ink)] bg-[var(--tn-ink)] px-6 py-3 hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            cd ~/
          </button>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);
  const trendingArticles = [...otherArticles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) return (b.trendingScore || 0) - (a.trendingScore || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);

  const createdAt = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const isoDate = createdAt.toISOString().slice(0, 16).replace("T", " ");
  const category = normalizeCategoryName(article.category?.categoryName) || "tech";

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
  const readMin = Math.max(1, Math.round(plainWords.length / 200));
  const excerptText = plainWords.slice(0, 26).join(" ") + (plainWords.length > 26 ? "…" : "");

  return (
    <div style={vars} className="bg-[var(--tn-bg)] min-h-screen font-sans pb-20 text-[var(--tn-ink)]">
      {/* path bar */}
      <div className="border-b border-[var(--tn-rule)] bg-[var(--tn-surface)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3 font-mono text-[12px] text-[var(--tn-muted)] flex items-center gap-2 overflow-x-auto">
          <button onClick={() => router.push("/")} className="hover:text-[var(--tn-accent)] transition-colors">~</button>
          <span>/</span>
          <span className="text-[var(--tn-accent)]">{category.toLowerCase()}</span>
          <span>/</span>
          <span className="text-[var(--tn-ink)] truncate">{article.slug || article.id}</span>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-12">
          <div className="lg:col-span-8">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.9rem] font-bold leading-[1.12] tracking-tight mb-6">
              <span className="text-[var(--tn-accent)] mr-2">#</span>{article.title}
            </h1>

            <dl className="font-mono text-[12px] text-[var(--tn-muted)] grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-y border-[var(--tn-rule)] py-4 mb-8">
              <dt className="text-[var(--tn-accent)]">author</dt><dd className="text-[var(--tn-ink)]">{theme.byline.toLowerCase()}</dd>
              <dt className="text-[var(--tn-accent)]">committed</dt><dd>{isoDate} UTC</dd>
              <dt className="text-[var(--tn-accent)]">topic</dt><dd>{category}</dd>
              <dt className="text-[var(--tn-accent)]">read</dt><dd>~{readMin} min</dd>
            </dl>

            <p className="text-lg text-[var(--tn-muted)] leading-relaxed mb-8">{excerptText}</p>

            {article.imageUrl && (
              <figure className="mb-10">
                <div className="relative aspect-[16/9] w-full bg-[var(--tn-accent-soft)] overflow-hidden border border-[var(--tn-rule)]" style={{ borderRadius: "var(--tn-radius)" }}>
                  <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="720px" priority />
                </div>
                <figcaption className="font-mono text-[10px] text-[var(--tn-muted)] mt-2">{`// ${theme.byline.toLowerCase()}`}</figcaption>
              </figure>
            )}

            {ad && (
              <div className="mb-10 flex justify-center border-y border-[var(--tn-rule)] py-5">
                <AdsterraBanner bannerKey={ad["468x60"] || ad["728x90"]} width={468} height={60} className="!my-0" />
              </div>
            )}

            <div className="border-l-2 border-[var(--tn-rule)] pl-5 sm:pl-7">
              <div
                className="prose max-w-none text-[17px] lg:text-[18px] leading-[1.85] text-[var(--tn-ink)] article-body [&_p]:mb-6 [&_h2]:font-serif [&_h2]:text-[var(--tn-ink)] [&_h2]:font-bold"
                dangerouslySetInnerHTML={{ __html: firstHtml }}
              />

              <ArticleImageGallery
                images={article.imageUrls ?? []}
                title={article.title}
                imageWrapperClassName="relative aspect-[16/9] bg-[var(--tn-accent-soft)] overflow-hidden border border-[var(--tn-rule)]"
              />

              {midArticleConfig && (
                <div className="my-10 flex justify-center border-y border-[var(--tn-rule)] py-6 bg-[var(--tn-accent-soft)]/30">
                  <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
                </div>
              )}

              {secondHtml && (
                <div
                  className="prose max-w-none text-[17px] lg:text-[18px] leading-[1.85] text-[var(--tn-ink)] article-body [&_p]:mb-6"
                  dangerouslySetInnerHTML={{ __html: secondHtml }}
                />
              )}
            </div>

            <ArticleShare site="dbtechnews" title={article.title} className="mt-14" />
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 flex flex-col gap-8">
              {ad?.["300x250"] && (
                <div className="flex justify-center">
                  <AdsterraBanner bannerKey={ad["300x250"]} width={300} height={250} className="!my-0" />
                </div>
              )}
              <div>
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--tn-ink)] mb-4 flex items-center gap-2">
                  <span className="text-[var(--tn-accent)]">&gt;</span> related
                </h3>
                <ol className="flex flex-col divide-y divide-[var(--tn-rule)] border-y border-[var(--tn-rule)]">
                  {trendingArticles.map((a, i) => (
                    <Link key={a.id} href={`/article/${a.slug || a.id}`} className="group flex gap-3 items-start py-4">
                      <span className="font-mono text-[13px] text-[var(--tn-rule)] group-hover:text-[var(--tn-accent)] transition-colors tabular-nums shrink-0 pt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] font-bold text-[var(--tn-muted)] uppercase tracking-[0.16em] block mb-1">
                          {normalizeCategoryName(a.category?.categoryName) || "tech"}
                        </span>
                        <h4 className="font-serif text-[14px] font-bold text-[var(--tn-ink)] leading-snug group-hover:text-[var(--tn-accent)] transition-colors line-clamp-2">
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
