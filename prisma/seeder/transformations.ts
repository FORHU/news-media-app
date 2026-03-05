import type { PrismaClient } from "../../src/generated/prisma/client";
import { articles } from "./articles";

const socialChannelsData = [
  { socialMediaName: "Twitter" },
  { socialMediaName: "LinkedIn" },
  { socialMediaName: "Facebook" },
];

export async function seedTransformations(
  prisma: PrismaClient,
  contentArticleIds: string[],
  socialChannelIds: string[]
): Promise<string[]> {
  const transformationIds: string[] = [];
  const articleCount = Math.min(3, contentArticleIds.length);
  const channelCount = Math.min(2, socialChannelIds.length);
  for (let i = 0; i < articleCount; i++) {
    for (let j = 0; j < channelCount; j++) {
      const created = await prisma.contentTransformation.create({
        data: {
          contentArticleId: contentArticleIds[i],
          socialChannelsId: socialChannelIds[j],
          tone: j === 0 ? "professional" : "casual",
          formatType: "post",
          transformedTitle: `[${socialChannelsData[j].socialMediaName}] ${articles[i].title.slice(0, 40)}`,
          transformedContent: articles[i].content.slice(0, 280) + "...",
          status: "published",
        } as unknown as Parameters<
          PrismaClient["contentTransformation"]["create"]
        >[0]["data"],
      });
      transformationIds.push(String(created.id));
    }
  }
  return transformationIds;
}
