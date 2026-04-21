import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type Banner = Prisma.BannerGetPayload<{}>;

export const bannersRepository = {
  async findMany(params: {
    position?: string | null;
    isActive?: boolean | null;
  }): Promise<Banner[]> {
    const { position, isActive } = params;

    const where: Prisma.BannerWhereInput = {};

    if (position) {
      where.position = position;
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

  async findById(id: string): Promise<Banner | null> {
    return prisma.banner.findUnique({
      where: { id },
    });
  },

  async create(data: Prisma.BannerCreateInput): Promise<Banner> {
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
