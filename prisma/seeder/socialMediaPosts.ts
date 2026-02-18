import type { PrismaClient } from "../../src/generated/prisma/client";

export async function seedSocialMediaPosts(
  prisma: PrismaClient,
  transformationIds: number[]
): Promise<void> {
  const now = new Date();
  for (const transId of transformationIds) {
    await prisma.socialMediaPost.create({
      data: {
        contentTransformationId: transId,
        postUrl: `https://example.com/post/${transId}`,
        mediaUrl: ["https://placehold.co/400x200"],
        postedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
}
