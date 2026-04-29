import { NextResponse } from "next/server";
import { ResponseType, XpozClient } from "@xpoz/xpoz";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type XpozPost = Record<string, unknown>;

function extractHandle(input: string): string {
  const value = input.trim();
  const match = value.match(/(?:x\.com|twitter\.com)\/([A-Za-z0-9_]+)/i);
  if (match?.[1]) return match[1];
  return value.replace(/^@/, "").split("/")[0];
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
}

function extractTweetText(post: XpozPost): string {
  const candidates = [
    getString(post.text),
    getString(post.fullText),
    getString(post.rawText),
    getString(post.content),
    getString(post.tweetText),
  ];

  const firstNonEmpty = candidates.find((value) => Boolean(value));
  return firstNonEmpty ?? "Tweet text unavailable from XPOZ output.";
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return (
          getString(record.videoUrl) ??
          getString(record.mediaUrl) ??
          getString(record.url) ??
          ""
        );
      }
      return "";
    })
    .filter((item) => item.length > 0);
}

function mapPostToTweet(post: XpozPost, fallbackHandle: string, index: number) {
  const id = getString(post.id) ?? `${fallbackHandle}-${index}`;
  const authorHandle =
    getString(post.authorUsername) ??
    getString(post.username) ??
    fallbackHandle;
  const text = extractTweetText(post);
  const url =
    getString(post.url) ??
    getString(post.tweetUrl) ??
    `https://x.com/${authorHandle}/status/${id}`;
  const retweetedPost = (post.retweetedPost || post.retweetedStatus) as XpozPost | undefined;
  const quotedPost = (post.quotedPost || post.quotedStatus) as XpozPost | undefined;

  const getMediaUrls = (p: XpozPost) => [
    ...getStringArray(p.mediaUrls),
    ...getStringArray(p.videoUrls),
    ...getStringArray(p.media),
    ...(p.extendedEntities ? getStringArray((p.extendedEntities as Record<string, unknown>).media) : []),
    ...(typeof p.videoUrl === "string" ? [p.videoUrl] : []),
  ];

  const rawMediaUrls = [
    ...getMediaUrls(post),
    ...(retweetedPost ? getMediaUrls(retweetedPost) : []),
    ...(quotedPost ? getMediaUrls(quotedPost) : []),
  ];

  console.log(`[DEBUG SCrape] ID: ${id}, isRetweet: ${post.isRetweet}, mediaUrls:`, JSON.stringify(post.mediaUrls), 'videoUrls:', JSON.stringify(post.videoUrls), 'videoUrl:', post.videoUrl, 'retweetedPost:', !!retweetedPost, 'quotedPost:', !!quotedPost, 'extendedEntities:', !!post.extendedEntities);

  const mediaUrls = Array.from(new Set(rawMediaUrls.filter(Boolean)));
  const thumbnailUrl =
    getString(post.thumbnailUrl) ??
    getString(post.previewImageUrl) ??
    getString(
      Array.isArray(post.media) && post.media[0] && typeof post.media[0] === "object"
        ? (post.media[0] as Record<string, unknown>).thumbnailUrl
        : undefined
    );
  const mediaType =
    getString(post.mediaType) ??
    getString(
      Array.isArray(post.media) && post.media[0] && typeof post.media[0] === "object"
        ? (post.media[0] as Record<string, unknown>).type
        : undefined
    );
  const createdAt = getString(post.createdAt) ?? new Date().toISOString();

  return {
    id,
    tweet_id: id,
    source_name: getString(post.authorName) ?? authorHandle,
    profile_url: `https://x.com/${authorHandle}`,
    text,
    tweet_timestamp: createdAt,
    has_media: mediaUrls.length > 0 || Boolean(thumbnailUrl),
    media_type: mediaType ?? null,
    media_urls: mediaUrls,
    thumbnail_url: thumbnailUrl ?? null,
    status: "crawled",
    url,
    createdAt,
    likes: getNumber(post.likeCount) ?? 0,
    retweets: getNumber(post.retweetCount) ?? 0,
    replies: getNumber(post.replyCount) ?? 0,
    authorHandle,
    authorName: getString(post.authorName) ?? authorHandle,
  };
}

export async function POST(req: Request) {
  let json: unknown;

  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = json as { profileUrlOrHandle?: string; limit?: number };
  const profileUrlOrHandle = body.profileUrlOrHandle?.trim();
  const limit = Number(body.limit);

  if (!profileUrlOrHandle) {
    return NextResponse.json(
      { error: "profileUrlOrHandle is required" },
      { status: 400 }
    );
  }

  const maxItems = Number.isFinite(limit)
    ? Math.min(Math.max(Math.floor(limit), 1), 50)
    : 5;
  const actorMinItems = 50;
  const actorRequestedItems = Math.max(maxItems, actorMinItems);
  const handle = extractHandle(profileUrlOrHandle);

  if (!handle) {
    return NextResponse.json(
      { error: "Invalid X profile URL or handle" },
      { status: 400 }
    );
  }

  const xpozApiKey = process.env.XPOZ_API_KEY;
  if (!xpozApiKey) {
    return NextResponse.json(
      {
        error: "Missing XPOZ_API_KEY in environment variables",
      },
      { status: 500 }
    );
  }

  const client = new XpozClient({
    apiKey: xpozApiKey,
    serverUrl: process.env.XPOZ_SERVER_URL,
  });

  try {
    await client.connect();

    const attempts: Array<{
      source: string;
      query: string;
      returnedItems: number;
      sampleKeys?: string[];
    }> = [];

    let posts: XpozPost[] = [];

    const authorResult = await client.twitter.getPostsByAuthor(handle, {
      responseType: ResponseType.Fast,
      limit: actorRequestedItems,
      fields: [
        "id",
        "text",
        "fullText",
        "rawText",
        "content",
        "tweetText",
        "url",
        "tweetUrl",
        "likeCount",
        "retweetCount",
        "replyCount",
        "createdAt",
        "mediaUrls",
        "mediaType",
        "thumbnailUrl",
        "isRetweet",
        "isReply",
        "authorUsername",
        "authorName",
        "videoUrl",
        "videoUrls",
        "retweetedPost",
        "quotedPost",
        "entities",
        "extendedEntities",
      ],
    });
    posts = (authorResult?.data ?? []) as XpozPost[];
    attempts.push({
      source: "getPostsByAuthor",
      query: handle,
      returnedItems: posts.length,
      sampleKeys: Object.keys(posts[0] ?? {}),
    });

    if (posts.length === 0) {
      const searchQuery = `from:${handle}`;
      const searchResult = await client.twitter.searchPosts(searchQuery, {
        responseType: ResponseType.Fast,
        limit: actorRequestedItems,
        fields: [
          "id",
          "text",
          "fullText",
          "rawText",
          "content",
          "tweetText",
          "url",
          "tweetUrl",
          "likeCount",
          "retweetCount",
          "replyCount",
          "createdAt",
          "mediaUrls",
          "mediaType",
          "thumbnailUrl",
          "isRetweet",
          "isReply",
          "authorUsername",
          "authorName",
          "videoUrl",
          "videoUrls",
          "retweetedPost",
          "quotedPost",
          "entities",
          "extendedEntities",
        ],
      });
      posts = (searchResult?.data ?? []) as XpozPost[];
      attempts.push({
        source: "searchPosts",
        query: searchQuery,
        returnedItems: posts.length,
        sampleKeys: Object.keys(posts[0] ?? {}),
      });
    }

    if (posts.length === 0) {
      return NextResponse.json(
        {
          error:
            "Scrape completed but no tweets were returned by XPOZ for this profile.",
          debug: {
            provider: "xpoz",
            requestedHandle: handle,
            attempts,
          },
        },
        { status: 502 }
      );
    }

    const normalizedHandle = handle.toLowerCase();
    const filteredPosts = posts.filter((post) => {
      const authorUsername = getString(post.authorUsername)?.toLowerCase();
      const isRetweet = getBoolean(post.isRetweet) ?? false;
      const isReply = getBoolean(post.isReply) ?? false;

      if (authorUsername && authorUsername !== normalizedHandle) {
        return false;
      }

      return !isRetweet && !isReply;
    });

    const sourcePosts = filteredPosts.length > 0 ? filteredPosts : posts;

    const tweets = sourcePosts.slice(0, maxItems).map((post, index) =>
      mapPostToTweet(post, handle, index)
    );

    if (tweets.length > 0) {
      try {
        await prisma.rawTweet.createMany({
          data: tweets.map((t) => ({
            tweetId: t.tweet_id,
            sourceName: t.source_name,
            profileUrl: t.profile_url,
            text: t.text,
            tweetTimestamp: t.tweet_timestamp,
            hasMedia: t.has_media,
            mediaType: t.media_type,
            mediaUrls: t.media_urls,
            thumbnailUrl: t.thumbnail_url,
            status: t.status,
            url: t.url,
            authorHandle: t.authorHandle,
            authorName: t.authorName,
            likes: t.likes,
            retweets: t.retweets,
            replies: t.replies,
          })),
          skipDuplicates: true,
        });
      } catch (dbError) {
        console.error("Failed to save scraped tweets to database:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      handle,
      count: tweets.length,
      tweets,
      debug: {
        provider: "xpoz",
        returnedItems: posts.length,
        filteredItems: filteredPosts.length,
        requestedItems: maxItems,
        actorRequestedItems,
        attempts,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to scrape from XPOZ";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client.close().catch(() => undefined);
  }
}
