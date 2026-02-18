import type { PrismaClient } from "../../src/generated/prisma/client";

const socialChannels = [
  { socialMediaName: "Twitter" },
  { socialMediaName: "LinkedIn" },
  { socialMediaName: "Facebook" },
];

export async function seedSocialChannels(prisma: PrismaClient): Promise<number[]> {
  const ids: number[] = [];
  for (const ch of socialChannels) {
    const existing = await prisma.socialChannel.findFirst({
      where: { socialMediaName: ch.socialMediaName },
    });
    if (existing) {
      ids.push(existing.id);
    } else {
      const created = await prisma.socialChannel.create({
        data: { socialMediaName: ch.socialMediaName },
      });
      ids.push(created.id);
    }
  }
  return ids;
}
