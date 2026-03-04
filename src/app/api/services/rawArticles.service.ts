import { rawArticlesRepository } from "@/app/api/repositories/rawArticles.repository";

export const rawArticlesService = {
  async getRawArticles() {
    return rawArticlesRepository.findMany();
  },
};

