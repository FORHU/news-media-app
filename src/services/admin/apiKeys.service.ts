import { createHash, randomBytes } from "crypto";
import { apiKeysRepository } from "@/repositories/admin/apiKeys.repository";

export class ApiKeysServiceError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiKeysServiceError";
  }
}

export const apiKeysService = {
  async create(sourceName: string, expiresAt: Date | null, tenantId: string) {
    await apiKeysRepository.upsertBotUser(tenantId);

    const rawKey = randomBytes(32).toString("hex");
    const hashedKey = createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await apiKeysRepository.create({
      key: hashedKey,
      tenantId,
      sourceName,
      expiresAt,
    });

    return { ...apiKey, rawKey };
  },

  list(tenantId: string) {
    return apiKeysRepository.findManyByTenant(tenantId);
  },

  async updateAutoPublish(id: string, autoPublish: boolean, tenantId: string) {
    const existing = await apiKeysRepository.findByIdAndTenant(id, tenantId);
    if (!existing) throw new ApiKeysServiceError("API key not found", 404);
    return apiKeysRepository.updateAutoPublish(id, autoPublish);
  },
};
