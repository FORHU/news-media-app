import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import type { PublishFailure } from "@/lib/generalPublishRules";

export type AuditAction =
  | "create"
  | "edit"
  | "publish"
  | "unpublish"
  | "site_publish"
  | "site_unpublish"
  | "sync"
  | "retry"
  | "delete";

export type AuditDetails = {
  /** Sites reached / sites that failed, for create, sync and retry. */
  reached?: number;
  failures?: PublishFailure[];
  /** Domain a per-site action applied to. */
  domain?: string;
  /** Fields changed by an edit. */
  fields?: string[];
  /** Number of sites the action touched. */
  sites?: number;
};

export type AuditEntry = {
  id: string;
  broadcastId: string;
  broadcastTitle: string;
  action: AuditAction;
  actorEmail: string | null;
  details: AuditDetails | null;
  createdAt: string;
};

/** True when the audit table hasn't been created yet (migration not applied). */
export function isMissingAuditTable(err: unknown): boolean {
  type ErrLike = { code?: string; message?: string; meta?: unknown; cause?: ErrLike } | null | undefined;
  // Driver adapters wrap the Postgres error, so read the whole cause chain.
  const parts: string[] = [];
  for (let e = err as ErrLike, depth = 0; e && depth < 4; e = e.cause, depth++) {
    parts.push(e.code ?? "", e.message ?? "");
    try {
      parts.push(JSON.stringify(e.meta ?? ""));
    } catch {
      // unserializable meta: ignore
    }
  }
  const text = parts.join(" ");
  return /P2021|42P01|TableDoesNotExist|does not exist/i.test(text) && /general_?publish_?audit/i.test(text);
}

export const generalPublishAuditRepository = {
  /**
   * Never throws: a failed audit write must not fail (or hide the result of)
   * the publish action it describes.
   */
  async record(entry: {
    broadcastId: string;
    broadcastTitle: string;
    action: AuditAction;
    actorEmail: string | null;
    details?: AuditDetails;
  }): Promise<void> {
    try {
      await prisma.generalPublishAudit.create({
        data: {
          broadcastId: entry.broadcastId,
          broadcastTitle: entry.broadcastTitle,
          action: entry.action,
          actorEmail: entry.actorEmail,
          details: (entry.details ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (err) {
      console.error("[generalPublishAudit] Failed to record entry:", err);
    }
  },

  async list(params: { broadcastId?: string; limit: number }): Promise<AuditEntry[]> {
    const rows = await prisma.generalPublishAudit.findMany({
      where: params.broadcastId ? { broadcastId: params.broadcastId } : {},
      orderBy: { createdAt: "desc" },
      take: params.limit,
    });
    return rows.map((r) => ({
      id: r.id,
      broadcastId: r.broadcastId,
      broadcastTitle: r.broadcastTitle,
      action: r.action as AuditAction,
      actorEmail: r.actorEmail,
      details: (r.details as AuditDetails | null) ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  /**
   * Create/sync/retry entries (the ones that can carry failures) for these
   * broadcasts. Degrades to "no failures known" instead of throwing, so the
   * main list keeps working if the audit table isn't migrated yet.
   */
  async listFailureCarriers(broadcastIds: string[]) {
    if (broadcastIds.length === 0) return [];
    try {
      const rows = await prisma.generalPublishAudit.findMany({
        where: { broadcastId: { in: broadcastIds }, action: { in: ["create", "sync", "retry"] } },
        orderBy: { createdAt: "asc" },
        select: { broadcastId: true, details: true },
      });
      return rows.map((r) => ({
        broadcastId: r.broadcastId,
        failures: ((r.details as AuditDetails | null)?.failures ?? null) as PublishFailure[] | null,
      }));
    } catch (err) {
      console.error("[generalPublishAudit] Failed to load failure history:", err);
      return [];
    }
  },
};
