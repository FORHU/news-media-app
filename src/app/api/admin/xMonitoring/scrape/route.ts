import { NextRequest, NextResponse } from "next/server";
import { XpozClient } from "@xpoz/xpoz";
import { prisma } from "@/lib/db";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type XpozPost = Record<string, unknown>;
type MediaState = "video" | "image" | "none";

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

function getObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item && typeof item === "object")
  );
}

function extractMediaUrlsFromObjects(items: Record<string, unknown>[]): string[] {
  return items
    .flatMap((item) => [
      getString(item.mediaUrl),
      getString(item.url),
      getString(item.media_url),
      getString(item.expanded_url),
      getString(item.display_url),
      getString(item.videoUrl),
      getString(item.video_url),
      getString(item.previewImageUrl),
      getString(item.preview_image_url),
      getString(item.thumbnailUrl),
      getString(item.thumbnail_url),
      ...getStringArray(item.urls),
      ...getStringArray(item.mediaUrls),
      ...getStringArray(item.videoUrls),
      ...getStringArray(item.variants),
    ])
    .filter((item): item is string => Boolean(item));
}

function splitCommaSeparatedUrls(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.replace(/^"+|"+$/g, "").replace(/\\"/g, "\"").trim())
    .filter((part) => /^https?:\/\//i.test(part));
}

function extractBracketIndexedMediaUrls(post: XpozPost): string[] {
  return Object.entries(post)
    .filter(([key]) => /^mediaUrls\[\d+\]$/i.test(key) || /^videoUrls\[\d+\]$/i.test(key))
    .flatMap(([, value]) => {
      const raw = getString(value);
      if (!raw) return [];
      if (/^https?:\/\//i.test(raw) && !raw.includes(",")) return [raw];
      return splitCommaSeparatedUrls(raw);
    });
}

function getMediaObjects(post: XpozPost): Record<string, unknown>[] {
  const entities = (post.entities as Record<string, unknown> | undefined) ?? {};
  const extendedEntities = (post.extendedEntities as Record<string, unknown> | undefined) ?? {};
  const legacyExtendedEntities =
    (post.extended_entities as Record<string, unknown> | undefined) ?? {};

  return [
    ...getObjectArray(post.media),
    ...getObjectArray(entities.media),
    ...getObjectArray(extendedEntities.media),
    ...getObjectArray(legacyExtendedEntities.media),
  ];
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

  const getMediaUrls = (p: XpozPost) => {
    const entities = (p.entities as Record<string, unknown> | undefined) ?? {};
    const extendedEntities = (p.extendedEntities as Record<string, unknown> | undefined) ?? {};
    const legacyExtendedEntities =
      (p.extended_entities as Record<string, unknown> | undefined) ?? {};
    const mediaObjects = getMediaObjects(p);

    return [
      ...getStringArray(p.mediaUrls),
      ...getStringArray(p.videoUrls),
      ...extractBracketIndexedMediaUrls(p),
      ...getStringArray(p.media),
      ...getStringArray(entities.media),
      ...getStringArray(extendedEntities.media),
      ...getStringArray(legacyExtendedEntities.media),
      ...extractMediaUrlsFromObjects(mediaObjects),
      ...(typeof p.videoUrl === "string" ? [p.videoUrl] : []),
      ...(typeof p.url === "string" ? [p.url] : []),
    ];
  };

    // Consolidate all media URLs collected from the post and related entities
    const rawMediaUrls = [
      ...getMediaUrls(post),
      ...(retweetedPost ? getMediaUrls(retweetedPost) : []),
      ...(quotedPost ? getMediaUrls(quotedPost) : []),
    ];
    const mediaObjects = [
      ...getMediaObjects(post),
      ...(retweetedPost ? getMediaObjects(retweetedPost) : []),
      ...(quotedPost ? getMediaObjects(quotedPost) : []),
    ];
    const mediaTypes = Array.from(
      new Set(
        mediaObjects
          .map((item) =>
            getString(item.type) ??
            getString(item.mediaType) ??
            getString(item.media_type) ??
            ""
          )
          .filter(Boolean)
        )
    );

    const mediaUrls = Array.from(new Set(rawMediaUrls.filter(Boolean)));
    // Determine media state (video, image, none) based on URLs and declared types

  const mediaType =
    getString(post.mediaType) ??
    getString(post.media_type) ??
    getString(
      Array.isArray(post.media) && post.media[0] && typeof post.media[0] === "object"
        ? ((post.media[0] as Record<string, unknown>).type ??
          (post.media[0] as Record<string, unknown>).mediaType ??
          (post.media[0] as Record<string, unknown>).media_type)
        : undefined
    ) ??
    getString(
      getObjectArray(
        ((post.extendedEntities as Record<string, unknown> | undefined)?.media as unknown) ?? []
      )[0]?.type
    ) ??
    mediaTypes[0];
    const hasVideoMedia = mediaUrls.some((url) => /\.(mp4|mov|m4v|webm|mkv|m3u8)(\?|$)/i.test(url)) ||
      (mediaTypes[0] ?? "").toLowerCase().includes("video") ||
      (mediaTypes[0] ?? "").toLowerCase().includes("animated_gif") ||
      (mediaTypes[0] ?? "").toLowerCase().includes("gif");

    let hasImageMedia = false;
    if (!hasVideoMedia) {
      hasImageMedia = mediaUrls.some((url) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)) ||
        (mediaTypes[0] ?? "").toLowerCase().includes("image") ||
        (mediaTypes[0] ?? "").toLowerCase().includes("photo");
    }

    const mediaState: MediaState = hasVideoMedia ? "video" : (hasImageMedia ? "image" : "none");

    const finalThumbnailUrl = mediaState === "video"
      ? null
      : (getString(post.thumbnailUrl) ??
          getString(post.thumbnail_url) ??
          getString(post.previewImageUrl) ??
          getString(post.preview_image_url) ??
          getString(
            Array.isArray(post.media) && post.media[0] && typeof post.media[0] === "object"
              ? ((post.media[0] as Record<string, unknown>).thumbnailUrl ??
                  (post.media[0] as Record<string, unknown>).thumbnail_url ??
                  (post.media[0] as Record<string, unknown>).previewImageUrl ??
                  (post.media[0] as Record<string, unknown>).preview_image_url)
              : undefined
          ) ??
          getString(
            getObjectArray(((post.extendedEntities as Record<string, unknown> | undefined)?.media as unknown) ?? [])[0]?.media_url
          )
        );

    const cleanUrls = (urls: string[]) => {
      const uniqueUrls = new Map<string, string>();
      const isMediaUrl = (url: string) => {
        const lower = url.toLowerCase();
        if (lower.match(/x\.com\/[^\/]+\/status\//) || lower.match(/twitter\.com\/[^\/]+\/status\//)) return false;
        if (lower.match(/^https?:\/\/t\.co\//)) return false;
        return true;
      };
      
      urls.filter(isMediaUrl).forEach(url => {
        try {
          const parsed = new URL(url);
          let basePath = parsed.origin + parsed.pathname;
          if (parsed.hostname.includes('twimg.com') && parsed.pathname.includes('/media/')) {
             basePath = basePath.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
          }
          if (!uniqueUrls.has(basePath)) {
            uniqueUrls.set(basePath, url);
          } else {
            const existing = uniqueUrls.get(basePath)!;
            if (url.includes('name=large') || url.includes('name=orig') || (!existing.includes('name=large') && !existing.includes('name=orig') && url.length > existing.length)) {
              uniqueUrls.set(basePath, url);
            }
          }
        } catch {
          if (!uniqueUrls.has(url)) uniqueUrls.set(url, url);
        }
      });
      return Array.from(uniqueUrls.values());
    };

    let filteredMediaUrls = mediaUrls;
    if (mediaState === "video") {
       const videoUrls = mediaUrls.filter((url) => /\.(mp4|mov|m4v|webm|mkv|m3u8)(\?|$)/i.test(url));
       filteredMediaUrls = videoUrls.length > 0 ? videoUrls : mediaUrls;
    }

    const finalMediaUrls = cleanUrls(filteredMediaUrls);
  if (mediaType === "video") {
    // TODO: If mediaType is video, call APISmith Apify actor for transcription.
  }
  const createdAt = getString(post.createdAt) ?? new Date().toISOString();

  return {
    id,
    tweet_id: id,
    source_name: getString(post.authorName) ?? authorHandle,
    profile_url: `https://x.com/${authorHandle}`,
    text,
    tweet_timestamp: createdAt,
    has_media: mediaState,
    media_type: mediaState !== "none" ? mediaState : (mediaType ?? null),
    media_urls: finalMediaUrls,
    thumbnail_url: mediaState === "video" ? null : finalThumbnailUrl ?? null,
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

export async function POST(req: NextRequest) {
  const tenantId = await resolveTenantIdFromRequest(req);
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

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
        "media",
        "media_url",
        "mediaType",
        "media_type",
        "thumbnailUrl",
        "thumbnail_url",
        "previewImageUrl",
        "preview_image_url",
        "isRetweet",
        "isReply",
        "authorUsername",
        "authorName",
        "videoUrl",
        "videoUrls",
        "entities",
        "extended_entities",
        "retweetedPost",
        "quotedPost",
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
          "media",
          "media_url",
          "mediaType",
          "media_type",
          "thumbnailUrl",
          "thumbnail_url",
          "previewImageUrl",
          "preview_image_url",
          "isRetweet",
          "isReply",
          "authorUsername",
          "authorName",
          "videoUrl",
          "videoUrls",
          "entities",
          "extended_entities",
          "retweetedPost",
          "quotedPost",
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

    const normalizedTweets = sourcePosts.map((post, index) =>
      mapPostToTweet(post, handle, index)
    );
    const tweets = normalizedTweets
      .sort((a, b) => Number(b.has_media !== "none") - Number(a.has_media !== "none"))
      .slice(0, maxItems);

    if (tweets.length > 0) {
      try {
        await prisma.rawTweet.createMany({
          data: tweets.map((t) => ({
            tenantId,
            tweetId: t.tweet_id,
            sourceName: t.source_name,
            profileUrl: t.profile_url,
            text: t.text,
            tweetTimestamp: t.tweet_timestamp,
            hasMedia: t.has_media !== "none",
            mediaType: t.media_type,
            mediaUrls: t.media_urls,
            thumbnailUrl: t.thumbnail_url,
            status: t.status,
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
