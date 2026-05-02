import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subWeeks } from "date-fns";
import { normalizeCategoryName } from "@/lib/categoryDisplay";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const tenantId = await resolveTenantIdFromRequest(req);
        if (!tenantId) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        const now = new Date();
        const oneWeekAgo = subWeeks(now, 1);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Execute all queries in parallel for maximum speed
        const [
            totalGenerated,
            lastWeekGenerated,
            totalCrawled,
            todayCrawled,
            totalUrls,
            activeJobs,
            pendingArticles,
            recentGen,
            recentCrawl
        ] = await Promise.all([
            // Counts
            prisma.contentArticle.count({ where: { tenantId } }),
            prisma.contentArticle.count({ where: { tenantId, createdAt: { gte: oneWeekAgo } } }),
            prisma.rawArticle.count({ where: { tenantId } }),
            prisma.rawArticle.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
            prisma.crawledUrl.count({ where: { tenantId } }),
            prisma.crawlJob.count({ 
                where: { 
                    tenantId, 
                    status: { in: ["PENDING", "RUNNING", "IN_PROGRESS", "Crawling"] } 
                } 
            }),
            prisma.rawArticle.count({ where: { tenantId, status: "pending" } }),
            
            // Recent Activity
            prisma.contentArticle.findMany({
                where: { tenantId },
                take: 5,
                orderBy: { createdAt: "desc" },
                include: { category: true }
            }),
            prisma.rawArticle.findMany({
                where: { tenantId },
                take: 5,
                orderBy: { createdAt: "desc" },
                include: { category: true }
            })
        ]);

        const stats = {
            generatedArticles: {
                total: totalGenerated,
                addedLastWeek: lastWeekGenerated
            },
            crawledArticles: {
                total: totalCrawled,
                addedToday: todayCrawled
            },
            crawledUrls: {
                total: totalUrls
            },
            activeCrawlers: {
                total: activeJobs
            },
            queueStatus: {
                pendingAI: pendingArticles,
                activeCrawls: activeJobs,
                totalToday: todayCrawled + lastWeekGenerated
            },
            recentActivity: [
                ...recentGen.map(a => ({
                    id: a.id,
                    type: "GENERATION",
                    title: a.title,
                    timestamp: a.createdAt,
                    status: "completed",
                    category: normalizeCategoryName(a.category?.categoryName) ?? undefined
                })),
                ...recentCrawl.map(a => ({
                    id: a.id,
                    type: "CRAWL",
                    title: a.title,
                    timestamp: a.createdAt,
                    status: "completed",
                    category: normalizeCategoryName(a.category?.categoryName) ?? undefined
                }))
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)
        };

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats." },
            { status: 500 }
        );
    }
}
