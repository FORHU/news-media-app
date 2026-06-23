import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type Banner = Prisma.BannerGetPayload<object>;

export const bannersRepository = {
  async findAllForTenant(tenantId: string): Promise<Banner[]> {
    return prisma.banner.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async findMany(params: {
    position?: string | null;
    isActive?: boolean | null;
    tenantId?: string | null;
  }): Promise<Banner[]> {
    const { position, isActive, tenantId } = params;

    const where: Prisma.BannerWhereInput = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (position) {
      where.positions = { has: position };
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive;
    }

    return prisma.banner.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findById(id: string, tenantId?: string | null): Promise<Banner | null> {
    if (tenantId) {
      return prisma.banner.findFirst({
        where: { id, tenantId },
      }) as Promise<Banner | null>;
    }
    return prisma.banner.findUnique({
      where: { id },
    });
  },

  async create(data: Prisma.BannerUncheckedCreateInput): Promise<Banner> {
    return prisma.banner.create({
      data,
    });
  },

  async update(id: string, data: Prisma.BannerUpdateInput): Promise<Banner> {
    return prisma.banner.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<Banner> {
    return prisma.banner.delete({
      where: { id },
    });
  },
};
