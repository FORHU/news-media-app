import { prisma } from "@/lib/db";

export const authRepository = {
  findAdminByEmail(email: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, role: "admin", tenantId },
      select: { id: true, email: true, password: true, role: true, tenantId: true },
    });
  },

  findModeratorByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, role: "moderator" },
      select: { id: true, email: true, password: true, role: true, tenantId: true },
    });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { firstName: true, lastName: true, email: true, role: true },
    });
  },

  findTenantById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      select: { domain: true },
    });
  },
};
