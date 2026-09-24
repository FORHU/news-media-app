"use client"; // LegalHyper Article — broadsheet reading page matching "The Legal Review" design

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StoryImage } from "@/components/StoryImage";
import { articlesApi } from "@/lib/api";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import type { Article } from "@/lib/types";
import { extractYoutubeId } from "@/lib/utils";
import TwitterStatusEmbed from "@/components/article/TwitterStatusEmbed";
import {
  isSocialCommentaryGenerationMode,
  splitReferenceLineFromContent,
  stripOriginalPostBlock,
} from "@/lib/tweetArticleDisplay";
import { ArticleShare } from "@/components/article/ArticleShare";
import { ArticleImageGallery } from "@/components/article/ArticleImageGallery";
import { AdsterraBanner } from "@/components/ads/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/ads/AdsterraNativeBanner";
import { ADSTERRA_CONFIG } from "@/config/adsterra";

const tenantConfig = ADSTERRA_CONFIG.legalhyper;
const adKeys = tenantConfig.banners;

const INK = "#0E1A2F";
const GOLD = "#8A6A22";
const BRASS = "#B08D3F";
const MAROON = "#7A1F2B";
const PARCHMENT = "#F4F0E6";
const RULE = "#DCD5C2";

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: "0.26em", color: GOLD }}>
      {children}
    </span>
  );
}

function readingMinutes(content?: string | null) {
  const words = (content ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function articleHref(a: { slug?: string | null; id: string }) {
  return `/article/${a.slug || a.id}`;
}

export default function LegalHyperArticle({
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
    const lockTime = 5 * 1000;

    if (!lastViewed || now - parseInt(lastViewed) > lockTime) {
      articlesApi.recordView(articleId).catch(console.error);
      localStorage.setItem(`viewed_${articleId}`, now.toString());
    }
  }, [articleId]);

  const { data: article, isError } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesApi.getArticle(articleId),
    enabled: Boolean(articleId),
  });

  const allArticles = initialOtherArticles;

  if (isError || !article) {
    return (
      <div
        className="font-chivo flex items-center justify-center py-32 px-6"
        style={{ background: PARCHMENT, minHeight: "60vh" }}
      >
        <div className="text-center max-w-md">
          <p className="font-bodoni uppercase text-xl mb-3" style={{ color: INK }}>
            Content Unavailable
          </p>
          <p className="mb-7 font-garamond text-[16px]" style={{ color: "#5C5749" }}>
            We couldn&apos;t load this article. Please try again, or return to the front page.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10.5px] uppercase px-6 py-3"
            style={{ background: INK, color: PARCHMENT, letterSpacing: "0.18em" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
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
    .slice(0, 6);

  const recommendedArticles = [...otherArticles]
    .sort((a, b) => {
      const aSameCat = a.categoryId === article.categoryId ? 1 : 0;
      const bSameCat = b.categoryId === article.categoryId ? 1 : 0;
      if (aSameCat !== bSameCat) return bSameCat - aSameCat;
      if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);

  const createdAt =
    article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt as string);
  const formattedDate = createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rawVideo = article.rawVideo;
  const youtubeUrl = article.youtubeUrl || rawVideo?.youtubeUrl || null;
  const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  const rawTweet = article.rawTweet;
  const isCommentaryTweetArticle =
    article.sourceType === "TWEET" && isSocialCommentaryGenerationMode(rawTweet?.generationMode);
  const isCommentaryVideoArticle =
    article.sourceType === "VIDEO" && isSocialCommentaryGenerationMode(rawVideo?.generationMode);
  const legacyVideoArticleNoRawRow = article.sourceType === "VIDEO" && Boolean(youtubeId) && !rawVideo;

  const showYoutubePlayer =
    Boolean(youtubeId) &&
    (article.sourceType !== "VIDEO" || isCommentaryVideoArticle || legacyVideoArticleNoRawRow);

  const showTweetCommentaryEmbed = isCommentaryTweetArticle && Boolean(rawTweet?.tweetId);
  const isCommentaryLayoutArticle = isCommentaryTweetArticle || isCommentaryVideoArticle;

  const bodyContent = isCommentaryLayoutArticle
    ? stripOriginalPostBlock(article.content)
    : article.content;

  const { main: layoutContent, referenceLine } = splitReferenceLineFromContent(
    bodyContent,
    isCommentaryLayoutArticle
  );

  const paragraphs = layoutContent.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const fullContent = paragraphs.join("\n\n");
  const midpoint = Math.ceil(paragraphs.length / 2);
  const firstHalf = paragraphs.slice(0, midpoint).join("\n\n");
  const secondHalf = paragraphs.slice(midpoint).join("\n\n");

  const categoryName = normalizeCategoryName(article.category?.categoryName);

  const midArticleAd = tenantConfig.midArticle ? (
    <div
      className="my-10 flex justify-center py-6"
      style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, background: "#EFEADC" }}
    >
      <AdsterraBanner
        bannerKey={tenantConfig.midArticle.key}
        width={tenantConfig.midArticle.width}
        height={tenantConfig.midArticle.height}
        className="!my-0"
      />
    </div>
  ) : null;

  const bodyTextClass = "font-garamond text-[19px] leading-[1.7] whitespace-pre-wrap";
  const bodyTextStyle = { color: "#2E2E27" };

  return (
    <div className="font-chivo" style={{ background: PARCHMENT, color: "#1A1A16", minHeight: "100vh" }}>
      <div className="max-w-[1340px] mx-auto px-4 sm:px-7 pt-8 pb-16">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          className="inline-flex items-center gap-2 text-[10.5px] uppercase mb-8 transition-colors hover:opacity-70"
          style={{ letterSpacing: "0.18em", color: "#5C5749" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <div className="flex flex-wrap gap-10 sm:gap-14">
          {/* Main column */}
          <article className="flex-1 min-w-0" style={{ flexBasis: 680 }}>
            <header>
              <div className="flex items-center gap-3.5">
                {categoryName ? <Kicker>{categoryName}</Kicker> : null}
                <span className="flex-1 h-px" style={{ background: BRASS }} />
              </div>
              <h1
                className="font-bodoni font-medium uppercase m-0 mt-5"
                style={{ fontSize: "clamp(28px,4vw,46px)", lineHeight: 1.08, color: INK }}
              >
                {article.title}
              </h1>
              <div
                className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-6 pt-4 text-[11px] uppercase"
                style={{ letterSpacing: "0.12em", color: "#7A7466", borderTop: `1px solid ${RULE}` }}
              >
                <span>{formattedDate}</span>
                <span className="w-px h-2.5" style={{ background: "#CBC4B1" }} />
                <span>{readingMinutes(fullContent)} min read</span>
              </div>
            </header>

            {showTweetCommentaryEmbed && rawTweet?.tweetId ? (
              <div className="mt-8 mb-10">
                <TwitterStatusEmbed tweetId={rawTweet.tweetId} profileUrl={rawTweet.profileUrl} />
              </div>
            ) : null}

            {showYoutubePlayer ? (
              <>
                <div
                  className="mt-7 mb-8 overflow-hidden bg-black aspect-video"
                  style={{ borderLeft: `3px solid ${MAROON}` }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

                {article.imageUrl ? (
                  <>
                    <div className={bodyTextClass} style={bodyTextStyle}>
                      {firstHalf}
                    </div>
                    {midArticleAd}
                    <figure className="relative my-8 overflow-hidden bg-[#E3DECF]" style={{ aspectRatio: "16/9" }}>
                      <StoryImage
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 68vw"
                        className="object-cover"
                        variant="hero"
                      />
                    </figure>
                    {secondHalf && (
                      <div className={bodyTextClass} style={bodyTextStyle}>
                        {secondHalf}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`mt-8 ${bodyTextClass}`} style={bodyTextStyle}>
                    {fullContent}
                  </div>
                )}
              </>
            ) : (
              <>
                <figure className="relative mt-7 overflow-hidden bg-[#E3DECF]" style={{ aspectRatio: "16/9" }}>
                  <StoryImage
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 68vw"
                    priority
                    className="object-cover"
                    variant="hero"
                  />
                </figure>

                <div className={`mt-8 ${bodyTextClass}`} style={bodyTextStyle}>
                  {firstHalf}
                </div>

                {midArticleAd}

                <ArticleImageGallery
                  images={article.imageUrls ?? []}
                  title={article.title}
                  imageWrapperClassName="relative overflow-hidden bg-[#E3DECF]"
                />

                {secondHalf && (
                  <div className={`mt-8 ${bodyTextClass}`} style={bodyTextStyle}>
                    {secondHalf}
                  </div>
                )}
              </>
            )}

            {referenceLine ? (
              <div className="mt-12 pt-6" style={{ borderTop: `1px solid ${RULE}` }}>
                <p className="text-[10px] font-bold uppercase mb-2" style={{ letterSpacing: "0.2em", color: GOLD }}>
                  Reference
                </p>
                <p className="font-garamond text-[15px] italic leading-relaxed" style={{ color: "#5C5749" }}>
                  {referenceLine}
                </p>
              </div>
            ) : null}

            <div className="mt-10 p-2" style={{ background: "#EFEADC", border: `1px solid ${RULE}` }}>
              <AdsterraNativeBanner domain="legalhyper.com" transparent />
            </div>

            <ArticleShare site="legalhyper" title={article.title} className="mt-12" />
          </article>

          {/* Sidebar */}
          <aside className="flex-1 min-w-0" style={{ flexBasis: 300 }}>
            <div className="sticky top-24 flex flex-col gap-9">
              {adKeys["300x250"] && (
                <div className="flex justify-center">
                  <AdsterraBanner bannerKey={adKeys["300x250"]} width={300} height={250} className="!my-0" />
                </div>
              )}

              {trendingArticles.length > 0 && (
                <div>
                  <div className="pb-4" style={{ borderBottom: `1px solid ${INK}` }}>
                    <h2 className="font-garamond font-semibold m-0" style={{ fontSize: 24, color: INK, letterSpacing: "0.02em" }}>
                      Trending Stories
                    </h2>
                  </div>
                  {trendingArticles.map((a, i) => (
                    <Link
                      key={a.id}
                      href={articleHref(a)}
                      className="flex gap-4.5 py-5"
                      style={{ borderBottom: `1px solid ${RULE}`, gap: 18 }}
                    >
                      <div className="font-bodoni shrink-0" style={{ fontSize: 32, lineHeight: 0.9, color: "#C3BCA7" }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="font-garamond" style={{ fontSize: 17, lineHeight: 1.32, color: INK }}>
                        {a.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Recommended */}
        {recommendedArticles.length > 0 && (
          <section className="pt-16 mt-16" style={{ borderTop: `3px double ${INK}` }}>
            <div className="flex items-baseline justify-between gap-5 pb-5" style={{ borderBottom: `1px solid ${INK}` }}>
              <h2 className="font-garamond font-semibold m-0" style={{ fontSize: 30, color: INK, letterSpacing: "0.02em" }}>
                Recommended Coverage
              </h2>
              <Link href="/search" className="text-[10.5px] uppercase shrink-0" style={{ letterSpacing: "0.2em", color: GOLD }}>
                All coverage →
              </Link>
            </div>
            <div className="grid gap-9 pt-9" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {recommendedArticles.map((a) => {
                const aCat = normalizeCategoryName(a.category?.categoryName);
                return (
                  <article key={a.id}>
                    <Link href={articleHref(a)} className="block">
                      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3", background: "#E3DECF" }}>
                        <StoryImage
                          src={a.imageUrl}
                          alt={a.title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 33vw, 100vw"
                        />
                      </div>
                    </Link>
                    {aCat ? (
                      <div className="mt-4">
                        <Kicker>{aCat}</Kicker>
                      </div>
                    ) : null}
                    <Link href={articleHref(a)}>
                      <h3 className="font-bodoni font-medium uppercase mt-2.5 mb-0" style={{ fontSize: 21, lineHeight: 1.22, color: INK }}>
                        {a.title}
                      </h3>
                    </Link>
                    <div className="mt-3 text-[10.5px] uppercase" style={{ letterSpacing: "0.12em", color: "#7A7466" }}>
                      {new Date(a.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
