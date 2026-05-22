import { AdBanner } from "@/components/AdBanner";
import { HeroSection } from "@/components/HeroSection";
import { LatestStoriesSection } from "@/components/home/latest-stories-section";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { FeaturedArticlesSection } from "@/components/home/featured-articles-section";
import { StoryImage } from "@/components/StoryImage";
import Link from "next/link";
import dynamic from "next/dynamic";

const TrendingProductsSection = dynamic(() => import("@/components/home/trending-products-section").then(m => m.TrendingProductsSection), { ssr: true });

interface Props {
  tenantId: string | null;
  articles: any[];
  banners: {
    top: any[];
    sidebar: any[];
    footer: any[];
  };
}

export default function NewsIconsLanding({ tenantId, articles, banners }: Props) {
  const sortedArticles = [...articles].sort((a, b) => {
    if ((b.trendingScore || 0) !== (a.trendingScore || 0)) {
      return (b.trendingScore || 0) - (a.trendingScore || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const heroArticles = sortedArticles.slice(0, 5);
  const heroIds = new Set(heroArticles.map(a => a.id));

  const trendingArticles = sortedArticles.filter(a => !heroIds.has(a.id));
  const trendingIds = new Set(trendingArticles.slice(0, 10).map(a => a.id));

  const sidebarPicks = sortedArticles
    .filter(a => !heroIds.has(a.id) && !trendingIds.has(a.id))
    .slice(0, 5);

  if (articles.length === 0) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl font-serif font-bold text-slate-800 mb-2">No stories available yet.</p>
          <p className="text-sm text-slate-400 mt-1">Check back soon for the latest from NewsIcons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      {/* Top Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdBanner position="HOME_TOP" initialBanners={banners.top} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* Hero Carousel */}
        {sortedArticles.length > 0 && (
          <div className="mb-10">
            <HeroSection articles={sortedArticles.slice(0, 5)} />
          </div>
        )}

        {/* Latest Stories + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <LatestStoriesSection
              articles={articles}
              error=""
              searchQuery={null}
              isLoading={false}
              domain="newsicons.com"
            />
          </div>

          <div className="space-y-8">
            <TrendingSidebar articles={trendingArticles} domain="newsicons.com" />
            
            {/* Must Read Section */}
            {sidebarPicks.length > 0 && (
              <div className="bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-6 flex items-center gap-2">
                  Must Read <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                </h3>
                <div className="space-y-6">
                  {sidebarPicks.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug || article.id}`} className="group block">
                      <div className="relative aspect-video overflow-hidden rounded-lg mb-3 bg-slate-100">
                        <StoryImage src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{article.category?.categoryName || "Must Read"}</span>
                      <h4 className="text-[15px] font-serif font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <AdBanner position="HOME_SIDEBAR" initialBanners={banners.sidebar} />
          </div>
        </div>

        {/* Featured Articles */}
        <FeaturedArticlesSection articles={sortedArticles.slice(0, 4)} domain="newsicons.com" />

        {/* Trending / Blog Posts */}
        <TrendingProductsSection
          articles={articles.filter((a: any) => a.status === "blog").slice(0, 4)}
        />

      </main>
    </div>
  );
}
