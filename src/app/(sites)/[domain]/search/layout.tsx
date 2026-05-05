import { resolveTenantIdFromDomain } from "@/lib/tenant";
import { articlesService } from "@/services/articles.service";
import { bannersService } from "@/services/banners.service";
import { TrendingSidebar } from "@/components/home/trending-sidebar";
import { AdBanner } from "@/components/AdBanner";
import { Suspense } from "react";

export default async function SearchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const tenantId = await resolveTenantIdFromDomain(domain);

  // Trending stories are "constant" for the search session, so we fetch them here
  const [trendingArticles, sidebarBanners] = await Promise.all([
    tenantId
      ? articlesService.getArticles({ limit: 10, status: "published" }, tenantId)
      : Promise.resolve([]),
    tenantId
      ? bannersService
          .getBanners({ position: "HOME_SIDEBAR", isActive: true, tenantId })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <div className="bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Content (Latest Stories Results) */}
          <div className="lg:col-span-2">
            {children}
          </div>

          {/* Sidebar (Stays loaded during result navigation) */}
          <aside className="space-y-8">
            <TrendingSidebar 
              articles={trendingArticles} 
              domain={domain}
            />
            <AdBanner position="HOME_SIDEBAR" initialBanners={sidebarBanners} />
          </aside>
        </div>
      </main>
    </div>
  );
}
