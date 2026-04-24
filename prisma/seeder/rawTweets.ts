import type { PrismaClient } from "../../src/generated/prisma/client";

export async function seedRawTweets(prisma: PrismaClient): Promise<string[]> {
  const makeCuid = () =>
    `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random()
      .toString(36)
      .slice(2, 10)}`.slice(0, 25);

  const seed = [
    {
      tweetId: "188999000111222333",
      sourceName: "Newsroom",
      profileUrl: "https://x.com/newsroom",
      text: "Breaking: A new policy update is rolling out this week. Here’s what to know.",
      tweetTimestamp: new Date().toISOString(),
      hasMedia: true,
      mediaType: "image",
      mediaUrls: ["https://placehold.co/1200x675/png"],
      thumbnailUrl: "https://placehold.co/600x338/png",
      status: "pending",
    },
    {
      tweetId: "188999000111222334",
      sourceName: "Tech Desk",
      profileUrl: "https://x.com/techdesk",
      text: "Thread: what changed in the latest release and why it matters.",
      tweetTimestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      hasMedia: false,
      mediaType: null,
      mediaUrls: [],
      thumbnailUrl: null,
      status: "pending",
    },
  ] as const;

  const createdIds: string[] = [];

  for (const t of seed) {
    const existing = (await prisma.$queryRaw<
      Array<{ id: string }>
    >`SELECT id FROM raw_tweets WHERE tweet_id = ${t.tweetId} LIMIT 1`)?.[0];

    if (existing?.id) {
      createdIds.push(existing.id);
      continue;
    }

    const id = makeCuid();
    await prisma.$executeRaw`
      INSERT INTO raw_tweets (
        id,
        tweet_id,
        source_name,
        profile_url,
        text,
        tweet_timestamp,
        has_media,
        media_type,
        media_urls,
        thumbnail_url,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${id},
        ${t.tweetId},
        ${t.sourceName},
        ${t.profileUrl},
        ${t.text},
        ${t.tweetTimestamp},
        ${t.hasMedia},
        ${t.mediaType},
        ${t.mediaUrls}::text[],
        ${t.thumbnailUrl},
        ${t.status},
        now(),
        now()
      )
    `;
    createdIds.push(id);
  }

  return createdIds;
}

