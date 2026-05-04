import type { PrismaClient } from "../../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const users = [
  {
    firstName: "Editor",
    lastName: "User",
    email: "editor@newsmedia.app",
    password: "change-me-in-production",
  },
];

export async function seedUsers(prisma: PrismaClient, tenantId?: string): Promise<string[]> {
  let targetTenantId = tenantId;
  if (!targetTenantId) {
    const firstTenant = await prisma.tenant.findFirst();
    if (!firstTenant) {
      console.warn("No tenants found to seed users into.");
      return [];
    }
    targetTenantId = firstTenant.id;
  }

  const userIds: string[] = [];
  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: targetTenantId,
          email: user.email,
        },
      },
    });
    if (existing) {
      userIds.push(String(existing.id));
      continue;
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const created = await prisma.user.create({
      data: {
        tenantId: targetTenantId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: hashedPassword,
        role: "admin",
      },
    });
    userIds.push(String(created.id));
  }
  return userIds;
}
