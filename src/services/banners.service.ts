import { bannersRepository, Banner } from "@/repositories/banners.repository";
import { Prisma } from "@/generated/prisma/client";

export class BannersServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "BannersServiceError";
  }
}

export const bannersService = {
  async getBanners(params: {
    position?: string | null;
    isActive?: boolean | null;
    tenantId?: string | null;
  }) {
    return bannersRepository.findMany(params);
  },

  async getBannerById(id: string, tenantId?: string | null) {
    if (!id || typeof id !== "string") {
      throw new BannersServiceError("Invalid id", 400);
    }

    const banner = await bannersRepository.findById(id, tenantId);
    if (!banner) {
      throw new BannersServiceError("Banner not found", 404);
    }

    return banner;
  },

  async createBanner(data: Prisma.BannerCreateInput) {
    return bannersRepository.create(data);
  },

  async updateBanner(id: string, data: Prisma.BannerUpdateInput) {
    return bannersRepository.update(id, data);
  },

  async deleteBanner(id: string) {
    return bannersRepository.delete(id);
  },
};
