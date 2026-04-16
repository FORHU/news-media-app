import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subDays, subWeeks } from "date-fns";

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
            }
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
