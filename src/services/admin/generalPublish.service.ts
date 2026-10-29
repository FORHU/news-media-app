import {
  generalPublishRepository,
  type FetchGeneralPublishesParams,
  type BroadcastOutcome,
  type UpdateBroadcastParams,
} from "@/repositories/admin/generalPublish.repository";
import {
  generalPublishAuditRepository,
  type AuditAction,
  type AuditDetails,
} from "@/repositories/admin/generalPublishAudit.repository";
import { deriveFailedTargets } from "@/lib/generalPublishRules";
import type { CreateManualGeneralPublishInput } from "@/lib/validation/generalPublish";

/** Reached/failed split of a fan-out, in the shape the audit log stores. */
export function summarizeOutcomes(outcomes: BroadcastOutcome[]): Pick<AuditDetails, "reached" | "failures"> {
  return {
    reached: outcomes.filter((o) => o.success).length,
    failures: outcomes
      .filter((o) => !o.success)
      .map((o) => ({ tenantId: o.tenantId, domain: o.domain, error: o.error ?? "unknown_error" })),
  };
}

type GetGeneralPublishesParams = {
  q: string;
  page: number;
  limit: number;
  category?: string;
  status?: string;
};

export const generalPublishService = {
  async getGeneralPublishes(params: GetGeneralPublishesParams) {
    const offset = (params.page - 1) * params.limit;

    const repositoryParams: FetchGeneralPublishesParams = {
      q: params.q,
      offset,
      limit: params.limit,
      category: params.category,
      status: params.status,
    };

    const [{ data, count }, targetTenants] = await Promise.all([
      generalPublishRepository.fetchGeneralPublishes(repositoryParams),
      // Live count of every current broadcast target (active tenants minus
      // Jeju) — NOT row.articles.length, which is frozen at however many
      // tenants existed when that particular broadcast was created. Using the
      // live count means every card's "X/Y sites" denominator grows the
      // moment a new tenant is added, instead of staying stuck at whatever Y
      // was on day one (e.g. an old broadcast correctly reads "11/14" once 3
      // more tenants have joined, showing it hasn't reached them yet).
      generalPublishRepository.getTargetTenants(),
    ]);
    const liveTargetCount = targetTenants.length;
    const failureCarriers = await generalPublishAuditRepository.listFailureCarriers(data.map((r) => r.id));

    const broadcasts = data.map((row) => {
      const publishedCount = row.articles.filter((a) => a.status === "published").length;
      const failedTargets = deriveFailedTargets(
        failureCarriers.filter((c) => c.broadcastId === row.id),
        new Set(row.articles.map((a) => a.tenantId))
      );
      const newTenantCount = generalPublishRepository.newTenantsSince(
        targetTenants,
        row,
        new Set(row.articles.map((a) => a.tenantId))
      ).length;
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        imageUrl: row.imageUrl,
        category: row.category,
        isHeadline: row.isHeadline,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        status: publishedCount > 0 ? "published" : "pending",
        targetCount: liveTargetCount,
        newTenantCount,
        publishedCount,
        failedTargets,
        targets: row.articles.map((a) => ({
          contentArticleId: a.id,
          slug: a.slug,
          tenantId: a.tenantId,
          domain: a.tenant.domain,
          siteName: a.tenant.siteName,
          status: a.status,
        })),
      };
    });

    return {
      broadcasts,
      pagination: {
        total: count,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(count / params.limit),
      },
    };
  },

  async createManualBroadcast(
    params: CreateManualGeneralPublishInput
  ): Promise<{ generalPublishId: string; outcomes: BroadcastOutcome[] }> {
    return generalPublishRepository.createBroadcast({
      title: params.title.trim(),
      content: params.content.trim(),
      category: params.category.trim(),
      imageUrls: params.imageUrls,
      targetTenantIds: params.targetTenantIds,
      // paraphrasePerTenant is left to the repository default: text is reworded
      // per tenant (angle-aware) whenever the broadcast reaches more than one
      // site, and published as authored when it targets a single site.
      isHeadline: params.isHeadline,
      publish: params.publish,
    });
  },

  async updateBroadcast(id: string, params: UpdateBroadcastParams): Promise<BroadcastOutcome[]> {
    return generalPublishRepository.updateBroadcast(id, params);
  },

  async unpublishBroadcast(id: string): Promise<BroadcastOutcome[]> {
    return generalPublishRepository.updateBroadcast(id, { publish: false });
  },

  async syncNewTenants(id: string, opts: { tenantIds?: string[] } = {}) {
    return generalPublishRepository.syncNewTenants(id, opts);
  },

  async setTargetStatus(broadcastId: string, articleId: string, publish: boolean) {
    return generalPublishRepository.setTargetStatus(broadcastId, articleId, publish);
  },

  /** Fire-and-forget history entry; never throws. */
  async audit(
    actorEmail: string | null,
    broadcast: { id: string; title: string },
    action: AuditAction,
    details?: AuditDetails
  ) {
    await generalPublishAuditRepository.record({
      broadcastId: broadcast.id,
      broadcastTitle: broadcast.title,
      action,
      actorEmail,
      details,
    });
  },

  async getAuditLog(params: { broadcastId?: string; limit: number }) {
    return generalPublishAuditRepository.list(params);
  },

  async deleteBroadcast(id: string) {
    return generalPublishRepository.deleteBroadcast(id);
  },
};
