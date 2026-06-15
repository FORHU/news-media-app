import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

const SELECT = {
  id: true,
  sourceName: true,
  isActive: true,
  autoPublish: true,
  expiresAt: true,
  createdAt: true,
} as const;

export const apiKeysRepository = {
  findTenantByDomain(domain: string) {
    return prisma.tenant.findFirst({ where: { domain }, select: { id: true } });
  },

  async upsertBotUser(tenantId: string) {
    const email = `external-bot@${tenantId}.internal`;
    return prisma.user.upsert({
      where: { tenantId_email: { tenantId, email } },
      update: {},
      create: {
        tenantId,
        email,
        firstName: "External",
        lastName: "Bot",
        role: "external_bot",
        password: randomBytes(16).toString("hex"),
      },
    });
  },

  create(data: { key: string; tenantId: string; sourceName: string; expiresAt: Date | null }) {
    return prisma.apiKey.create({
      data,
      select: { id: true, sourceName: true, tenantId: true, isActive: true, expiresAt: true, createdAt: true },
    });
  },

  findManyByTenant(tenantId: string) {
    return prisma.apiKey.findMany({
      where: { tenantId },
      select: SELECT,
      orderBy: { createdAt: "desc" },
    });
  },

  findByIdAndTenant(id: string, tenantId: string) {
    return prisma.apiKey.findFirst({ where: { id, tenantId } });
  },

  updateAutoPublish(id: string, autoPublish: boolean) {
    return prisma.apiKey.update({
      where: { id },
      data: { autoPublish },
      select: SELECT,
    });
  },
};
