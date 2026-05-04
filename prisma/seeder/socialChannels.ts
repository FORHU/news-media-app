import type { PrismaClient } from "../../src/generated/prisma/client";

const socialChannels = [
  { socialMediaName: "Twitter" },
  { socialMediaName: "LinkedIn" },
  { socialMediaName: "Facebook" },
];

export async function seedSocialChannels(
  prisma: PrismaClient,
  tenantId: string
): Promise<string[]> {
  const ids: string[] = [];
  for (const ch of socialChannels) {
    const existing = await prisma.socialChannel.findFirst({
      where: { tenantId, socialMediaName: ch.socialMediaName },
    });
    if (existing) {
      ids.push(String(existing.id));
    } else {
      const created = await prisma.socialChannel.create({
        data: { tenantId, socialMediaName: ch.socialMediaName },
      });
      ids.push(String(created.id));
    }
  }
  return ids;
}
