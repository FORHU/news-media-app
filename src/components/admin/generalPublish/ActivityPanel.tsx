"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff, Loader2, Pencil, Plus, RefreshCw, RotateCcw, Send, Trash2, type LucideIcon } from "lucide-react";
import { articlesApi } from "@/lib/api";
import type { GeneralPublishAuditEntry } from "@/lib/types";

const ACTION_ICON: Record<GeneralPublishAuditEntry["action"], LucideIcon> = {
    create: Plus,
    edit: Pencil,
    publish: Send,
    unpublish: EyeOff,
    site_publish: Eye,
    site_unpublish: EyeOff,
    sync: RefreshCw,
    retry: RotateCcw,
    delete: Trash2,
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One sentence per entry: what happened, to which article, and how far it reached. */
export function describeEntry(e: GeneralPublishAuditEntry): { verb: string; detail?: string } {
    const d = e.details;
    const failed = d?.failures?.length ?? 0;
    switch (e.action) {
        case "create":
            return {
                verb: "Created",
                detail: d?.reached != null
                    ? `${plural(d.reached, "site", "sites")} reached${failed ? `, ${failed} failed` : ""}`
                    : undefined,
            };
        case "edit":
            return { verb: "Edited", detail: d?.fields?.length ? d.fields.join(", ") : undefined };
        case "publish":
            return { verb: "Published", detail: d?.sites != null ? `on ${plural(d.sites, "site", "sites")}` : undefined };
        case "unpublish":
            return { verb: "Unpublished", detail: d?.sites != null ? `from ${plural(d.sites, "site", "sites")}` : undefined };
        case "site_publish":
            return { verb: "Published", detail: d?.domain ? `to ${d.domain} only` : undefined };
        case "site_unpublish":
            return { verb: "Unpublished", detail: d?.domain ? `from ${d.domain} only` : undefined };
        case "sync":
            return {
                verb: "Added to new sites",
                detail: d?.reached != null ? `${plural(d.reached, "site", "sites")}${failed ? `, ${failed} failed` : ""}` : undefined,
            };
        case "retry":
            return {
                verb: "Retried failed sites",
                detail: d?.reached != null ? `${d.reached} delivered${failed ? `, ${failed} still failing` : ""}` : undefined,
            };
        case "delete":
            return { verb: "Deleted", detail: d?.sites != null ? `from ${plural(d.sites, "site", "sites")}` : undefined };
    }
}

export default function ActivityPanel() {
    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ["generalPublishAudit"],
        queryFn: () => articlesApi.getGeneralPublishAudit(40),
    });
    const entries = data?.entries ?? [];

    return (
        <section
            aria-label="Recent General Publish activity"
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
        >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-black text-gray-900">Recent activity</h2>
                {isFetching && !isLoading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" aria-label="Refreshing" /> : null}
            </div>

            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" aria-label="Loading activity" />
                </div>
            ) : isError ? (
                <div className="py-10 px-5 text-center">
                    <p className="text-sm font-bold text-gray-900">Couldn&apos;t load activity.</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-2 text-xs font-black uppercase tracking-wider text-orange-700 hover:text-orange-800 focus-visible:outline-2 focus-visible:outline-orange-500 rounded"
                    >
                        Try again
                    </button>
                </div>
            ) : data?.setupPending ? (
                <div className="py-10 px-5 text-center">
                    <p className="text-sm font-bold text-gray-900">Activity tracking isn&apos;t switched on yet.</p>
                    <p className="mt-1 text-xs font-medium text-gray-500 max-w-sm mx-auto leading-relaxed">
                        It starts recording once the database update has been applied. Publishing and editing
                        keep working in the meantime.
                    </p>
                </div>
            ) : entries.length === 0 ? (
                <p className="py-10 px-5 text-center text-sm font-medium text-gray-500">
                    Nothing yet. Publishes, edits and deletes will be listed here.
                </p>
            ) : (
                <ul className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
                    {entries.map((e) => {
                        const Icon = ACTION_ICON[e.action];
                        const { verb, detail } = describeEntry(e);
                        return (
                            <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                                <Icon className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" aria-hidden />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-900 leading-snug">
                                        <span className="font-black">{verb}</span>{" "}
                                        <span className="font-semibold">&ldquo;{e.broadcastTitle}&rdquo;</span>
                                        {detail ? <span className="text-gray-600"> · {detail}</span> : null}
                                    </p>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                                        {e.actorEmail ?? "Unknown user"} ·{" "}
                                        <time dateTime={e.createdAt} title={new Date(e.createdAt).toLocaleString()}>
                                            {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                                        </time>
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
