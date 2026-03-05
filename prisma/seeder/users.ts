import type { PrismaClient } from "../../src/generated/prisma/client";

const users = [
  {
    firstName: "Editor",
    lastName: "User",
    email: "editor@newsmedia.app",
    password: "change-me-in-production",
  },
];

export async function seedUsers(prisma: PrismaClient): Promise<string[]> {
  const userIds: string[] = [];
  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing) {
      userIds.push(String(existing.id));
      continue;
    }
    const created = await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: user.password,
      },
    });
    userIds.push(String(created.id));
  }
  return userIds;
}
