import { prisma } from "@/lib/db";
import { subWeeks } from "date-fns";

export const dashboardRepository = {
  async getStats(tenantId: string) {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalGenerated,
      lastWeekGenerated,
      totalCrawled,
      todayCrawled,
      totalUrls,
      activeJobs,
      pendingArticles,
      recentGen,
      recentCrawl,
    ] = await prisma.$transaction([
      prisma.contentArticle.count({ where: { tenantId } }),
      prisma.contentArticle.count({ where: { tenantId, createdAt: { gte: oneWeekAgo } } }),
      prisma.rawArticle.count({ where: { tenantId } }),
      prisma.rawArticle.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
      prisma.crawledUrl.count({ where: { tenantId } }),
      prisma.crawlJob.count({
        where: { tenantId, status: { in: ["PENDING", "RUNNING", "IN_PROGRESS", "Crawling"] } },
      }),
      prisma.rawArticle.count({ where: { tenantId, status: "pending" } }),
      prisma.contentArticle.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { category: true },
      }),
      prisma.rawArticle.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { category: true },
      }),
    ]);

    return {
      totalGenerated,
      lastWeekGenerated,
      totalCrawled,
      todayCrawled,
      totalUrls,
      activeJobs,
      pendingArticles,
      recentGen,
      recentCrawl,
    };
  },
};
