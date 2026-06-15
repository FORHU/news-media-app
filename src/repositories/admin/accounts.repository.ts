import { prisma } from "@/lib/db";

const SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const accountsRepository = {
  findMany(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId },
      select: SELECT,
      orderBy: { createdAt: "desc" },
    });
  },

  findByEmail(email: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, tenantId },
    });
  },

  findByIdAndTenant(id: string, tenantId: string) {
    return prisma.user.findFirst({ where: { id, tenantId } });
  },

  create(data: { tenantId: string; firstName: string; lastName: string; email: string; password: string }) {
    return prisma.user.create({
      data: { ...data, role: "admin" },
      select: SELECT,
    });
  },

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  update(id: string, data: Record<string, unknown>) {
    return prisma.user.update({
      where: { id },
      data,
      select: SELECT,
    });
  },
};
