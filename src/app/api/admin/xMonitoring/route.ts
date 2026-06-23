import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const tenantId = await resolveTenantIdFromRequest(req);
        if (!tenantId) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get("limit") || "20");

        const tweets = await prisma.rawTweet.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: Math.min(limit, 100),
        });

        // Map database fields to the UI expected format
        const formattedTweets = tweets.map(t => ({
            id: t.id,
            tweet_id: t.tweetId,
            source_name: t.sourceName,
            profile_url: t.profileUrl,
            text: t.text,
            tweet_timestamp: t.tweetTimestamp,
            has_media: t.hasMedia ? "image" : "none", // Simple mapping for now
            media_type: t.mediaType,
            media_urls: t.mediaUrls,
            thumbnail_url: t.thumbnailUrl,
            status: t.status,
            url: `https://x.com/i/status/${t.tweetId}`,
            createdAt: t.createdAt,
            authorHandle: t.profileUrl?.split('/').pop() || "",
            authorName: t.sourceName
        }));

        return NextResponse.json({ tweets: formattedTweets });
    } catch (error: unknown) {
        console.error("Error fetching raw tweets:", error);
        return NextResponse.json(
            { error: "Failed to fetch crawled tweets" },
            { status: 500 }
        );
    }
}
