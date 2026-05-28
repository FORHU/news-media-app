import { cache } from "react";
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
  getAllBannersForTenant: cache(async (tenantId: string) => {
    const all = await bannersRepository.findAllForTenant(tenantId);
    const byPosition = (pos: string) => all.filter((b) => b.positions?.includes(pos));
    return {
      top:        byPosition("HOME_TOP"),
      sidebar:    byPosition("HOME_SIDEBAR"),
      footer:     byPosition("GLOBAL_FOOTER"),
      sideLTop:   byPosition("SIDEBAR_L_TOP"),
      sideLMid:   byPosition("SIDEBAR_L_MID"),
      sideRMid:   byPosition("SIDEBAR_R_MID"),
      sideRBtm:   byPosition("SIDEBAR_R_BTM"),
      contentMid: byPosition("CONTENT_MID"),
    };
  }),

  getBanners: cache(async (params: {
    position?: string | null;
    isActive?: boolean | null;
    tenantId?: string | null;
  }) => {
    return bannersRepository.findMany(params);
  }),

  getBannerById: cache(async (id: string, tenantId?: string | null) => {
    if (!id || typeof id !== "string") {
      throw new BannersServiceError("Invalid id", 400);
    }

    const banner = await bannersRepository.findById(id, tenantId);
    if (!banner) {
      throw new BannersServiceError("Banner not found", 404);
    }

    return banner;
  }),

  async createBanner(data: Prisma.BannerUncheckedCreateInput) {
    return bannersRepository.create(data);
  },

  async updateBanner(id: string, data: Prisma.BannerUpdateInput) {
    return bannersRepository.update(id, data);
  },

  async deleteBanner(id: string) {
    return bannersRepository.delete(id);
  },
};
