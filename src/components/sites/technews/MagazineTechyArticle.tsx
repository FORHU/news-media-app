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
import { getTechNewsTheme, techNewsVars } from "./theme";

export default function MagazineTechyArticle({
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
        <div className="aspect-[21/9] max-h-[70vh] w-full bg-[var(--tn-accent-soft)]" />
        <div className="max-w-[720px] mx-auto px-4 mt-12 space-y-5">
          <div className="h-4 w-32 bg-[var(--tn-accent-soft)] mx-auto" />
          <div className="h-12 w-full bg-[var(--tn-accent-soft)]" />
          <div className="h-12 w-2/3 bg-[var(--tn-accent-soft)] mx-auto" />
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div style={vars} className="flex items-center justify-center py-32 px-6 bg-[var(--tn-bg)] min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-[var(--tn-ink)] font-serif text-2xl font-semibold mb-3">This piece has slipped the binding.</p>
          <p className="text-[var(--tn-muted)] mb-6">We couldn&apos;t load the feature. Try again or head back.</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tn-accent-ink)] bg-[var(--tn-ink)] px-6 py-3 hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" /> Back to the issue
          </button>
        </div>
      </div>
    );
  }

  const otherArticles = initialOtherArticles.filter((a) => a.id !== article.id);
  const moreFeatures = [...otherArticles]
    .sort((a, b) => {
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) return (b.trendingScore || 0) - (a.trendingScore || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);

  const createdAt = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate = createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const category = normalizeCategoryName(article.category?.categoryName) || "Feature";

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
        `${prefix}<span class="float-left font-serif font-semibold text-[64px] leading-[0.8] mr-3 mt-2 text-[var(--tn-accent)]">${letter}</span>`,
    );
  }

  const rawHtml = normalizeContent(article.content || "");
  const [firstHtml, secondHtml] = splitHtmlAtMidpoint(rawHtml);
  const firstHtmlWithCap = injectDropCap(firstHtml);
  const plainWords = rawHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  const standfirst = plainWords.slice(0, 32).join(" ") + (plainWords.length > 32 ? "…" : "");
  const readMin = Math.max(1, Math.round(plainWords.length / 200));

  return (
    <div style={vars} className="bg-[var(--tn-bg)] min-h-screen pb-24 text-[var(--tn-ink)] font-sans">
      {article.imageUrl && (
        <figure className="relative w-full aspect-[21/9] max-h-[72vh] bg-[var(--tn-accent-soft)] overflow-hidden">
          <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover" variant="hero" priority sizes="100vw" />
        </figure>
      )}

      <article className="max-w-[720px] mx-auto px-4 sm:px-6">
        <header className="text-center pt-14 pb-10">
          <span className="font-serif italic text-[15px] text-[var(--tn-accent)]">{category}</span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.08] tracking-[-0.01em] mt-4 mb-6">
            {article.title}
          </h1>
          <p className="font-serif text-xl leading-[1.6] text-[var(--tn-muted)] max-w-[38ch] mx-auto">
            {standfirst}
          </p>
          <div className="flex items-center justify-center gap-4 mt-8 text-[11px] uppercase tracking-[0.18em] text-[var(--tn-muted)]">
            <span className="h-px w-8 bg-[var(--tn-rule)]" />
            <span className="text-[var(--tn-ink)] font-semibold">By {theme.byline}</span>
            <span>·</span>
            <span>{formattedDate}</span>
            <span>·</span>
            <span>{readMin} min</span>
            <span className="h-px w-8 bg-[var(--tn-rule)]" />
          </div>
        </header>

        {ad && (
          <div className="flex justify-center border-y border-[var(--tn-rule)] py-5 mb-10">
            <AdsterraBanner bannerKey={ad["468x60"] || ad["728x90"]} width={468} height={60} className="!my-0" />
          </div>
        )}

        <div
          className="prose max-w-none text-[19px] leading-[1.75] text-[var(--tn-ink)] font-sans article-body [&_p]:mb-6 [&_h2]:font-serif [&_h2]:font-semibold [&_h2]:text-[1.6rem] [&_h2]:mt-10"
          dangerouslySetInnerHTML={{ __html: firstHtmlWithCap }}
        />

        <ArticleImageGallery
          images={article.imageUrls ?? []}
          title={article.title}
          imageWrapperClassName="relative aspect-[3/2] bg-[var(--tn-accent-soft)] overflow-hidden my-10"
        />

        {midArticleConfig && (
          <div className="my-12 flex justify-center border-y border-[var(--tn-rule)] py-6">
            <AdsterraBanner bannerKey={midArticleConfig.key} width={midArticleConfig.width} height={midArticleConfig.height} className="!my-0" />
          </div>
        )}

        {secondHtml && (
          <div
            className="prose max-w-none text-[19px] leading-[1.75] text-[var(--tn-ink)] font-sans article-body [&_p]:mb-6"
            dangerouslySetInnerHTML={{ __html: secondHtml }}
          />
        )}

        <ArticleShare site="magazinetechy" title={article.title} className="mt-14" />
      </article>

      {moreFeatures.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-4 sm:px-6 mt-20 pt-12 border-t-[3px] border-double border-[var(--tn-ink)]">
          <h2 className="font-serif text-2xl font-semibold text-center mb-10">More features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {moreFeatures.map((a) => (
              <Link key={a.id} href={`/article/${a.slug || a.id}`} className="group block text-center">
                <div className="relative aspect-[4/3] bg-[var(--tn-accent-soft)] overflow-hidden mb-4">
                  <StoryImage src={a.imageUrl} alt={a.title} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-700" sizes="340px" />
                </div>
                <span className="font-serif italic text-[13px] text-[var(--tn-accent)]">
                  {normalizeCategoryName(a.category?.categoryName) || "Feature"}
                </span>
                <h3 className="font-serif text-xl font-semibold leading-snug text-[var(--tn-ink)] mt-1 group-hover:text-[var(--tn-accent)] transition-colors">
                  {a.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
