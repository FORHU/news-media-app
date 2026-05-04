import { prisma } from "@/lib/db";
import { CrawlJob } from "@/generated/prisma/client";

export const crawlJobsRepository = {
  async fetchJobs(params: { offset: number; limit: number; tenantId: string }) {
    const { offset, limit, tenantId } = params;

    const [rows, count] = await Promise.all([
      prisma.crawlJob.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { rawArticles: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.crawlJob.count({
        where: { tenantId },
      }),
    ]);

    return {
      rows,
      count,
    };
  },
};
