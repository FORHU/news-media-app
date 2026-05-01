import type { PrismaClient } from "../../src/generated/prisma/client";

export async function seedRawVideos(prisma: PrismaClient, tenantId: string): Promise<string[]> {
  const makeCuid = () =>
    `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random()
      .toString(36)
      .slice(2, 10)}`.slice(0, 25);
 
  const seed = [
    {
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      language: "en",
      transcribedContent:
        "Sample transcript text for testing the RawVideo → ContentArticle pipeline.",
      prompt: "Summarize this transcript into a short news article.",
    },
  ] as const;
 
  const createdIds: string[] = [];
 
  for (const v of seed) {
    const existing = (await prisma.$queryRaw<
      Array<{ id: string }>
    >`SELECT id FROM raw_videos WHERE youtube_url = ${v.youtubeUrl} AND tenant_id = ${tenantId} LIMIT 1`)?.[0];
    if (existing?.id) {
      createdIds.push(existing.id);
      continue;
    }
 
    const id = makeCuid();
    await prisma.$executeRaw`
      INSERT INTO raw_videos (
        id,
        tenant_id,
        language,
        youtube_url,
        transcribed_content,
        prompt,
        created_at,
        updated_at
      ) VALUES (
        ${id},
        ${tenantId},
        ${v.language},
        ${v.youtubeUrl},
        ${v.transcribedContent},
        ${v.prompt},
        now(),
        now()
      )
    `;
    createdIds.push(id);
  }
 
  return createdIds;
}

