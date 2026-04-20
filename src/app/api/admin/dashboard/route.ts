import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subDays, subWeeks } from "date-fns";
import { normalizeCategoryName } from "@/lib/categoryDisplay";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const now = new Date();
        
        // Last week start (for generated articles)
        const oneWeekAgo = subWeeks(now, 1);
        
        // Today start (for crawled articles)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generated Articles
        const totalGeneratedArticles = await prisma.contentArticle.count();
        const generatedLastWeekCount = await prisma.contentArticle.count({
            where: {
                createdAt: {
                    gte: oneWeekAgo
                }
            }
        });

        // Crawled Articles
        const totalCrawledArticles = await prisma.rawArticle.count();
        const crawledTodayCount = await prisma.rawArticle.count({
            where: {
                createdAt: {
                    gte: today
                }
            }
        });

        // Crawled URLs
        const totalCrawledUrls = await prisma.crawledUrl.count();

        // Active Crawlers
        const activeCrawlers = await prisma.crawlJob.count({
            where: {
                status: {
                    in: ["PENDING", "RUNNING", "IN_PROGRESS"]
                }
            }
        });

        // Recent Activity (Latest 5 of each)
        const recentGenerated = await prisma.contentArticle.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { category: true }
        });

        const recentCrawled = await prisma.rawArticle.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { category: true }
        });

        // Queue Details
        const pendingArticlesCount = await prisma.rawArticle.count({
            where: { status: "pending" }
        });

        const stats = {
            generatedArticles: {
                total: totalGeneratedArticles,
                addedLastWeek: generatedLastWeekCount
            },
            crawledArticles: {
                total: totalCrawledArticles,
                addedToday: crawledTodayCount
            },
            crawledUrls: {
                total: totalCrawledUrls
            },
            activeCrawlers: {
                total: activeCrawlers
            },
            queueStatus: {
                pendingAI: pendingArticlesCount,
                activeCrawls: activeCrawlers,
                totalToday: crawledTodayCount + generatedLastWeekCount // Approximation for "today"
            },
            recentActivity: [
                ...recentGenerated.map(a => ({
                    id: a.id,
                    type: "GENERATION",
                    title: a.title,
                    timestamp: a.createdAt,
                    status: "completed",
                    category: normalizeCategoryName(a.category?.categoryName) ?? undefined
                })),
                ...recentCrawled.map(a => ({
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
