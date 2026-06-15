import { dashboardRepository } from "@/repositories/admin/dashboard.repository";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

export const dashboardService = {
  async getStats(tenantId: string) {
    const d = await dashboardRepository.getStats(tenantId);

    return {
      generatedArticles: { total: d.totalGenerated, addedLastWeek: d.lastWeekGenerated },
      crawledArticles: { total: d.totalCrawled, addedToday: d.todayCrawled },
      crawledUrls: { total: d.totalUrls },
      activeCrawlers: { total: d.activeJobs },
      queueStatus: {
        pendingAI: d.pendingArticles,
        activeCrawls: d.activeJobs,
        totalToday: d.todayCrawled + d.lastWeekGenerated,
      },
      recentActivity: [
        ...d.recentGen.map((a) => ({
          id: a.id,
          type: "GENERATION",
          title: a.title,
          timestamp: a.createdAt,
          status: "completed",
          category: normalizeCategoryName(a.category?.categoryName) ?? undefined,
        })),
        ...d.recentCrawl.map((a) => ({
          id: a.id,
          type: "CRAWL",
          title: a.title,
          timestamp: a.createdAt,
          status: "completed",
          category: normalizeCategoryName(a.category?.categoryName) ?? undefined,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10),
    };
  },
};
