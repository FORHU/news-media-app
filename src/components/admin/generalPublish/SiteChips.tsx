"use client";

import React from "react";
import { ExternalLink, Loader2, RotateCcw, Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toaster";
import { articlesApi } from "@/lib/api";
import type { GeneralPublishBroadcast, GeneralPublishTarget } from "@/lib/types";

const CHIP_BASE =
    "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500";

const ACTION_BASE =
    "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-orange-500";

export const liveUrl = (t: { domain: string; slug: string | null; contentArticleId: string }) =>
    `https://${t.domain}/article/${t.slug ?? t.contentArticleId}`;

/** Turns the repository's raw failure codes into a sentence with a next step. */
export function describeFailure(error: string): string {
    if (error === "no_system_user") {
        return "This site has no admin user to attribute the article to. Add one, then retry.";
    }
    return `${error}. Retry once the cause is fixed.`;
}

function errorMessage(err: unknown, fallback: string) {
    return err instanceof Error && err.message ? err.message : fallback;
}

export function SiteChip({
    broadcastId,
    target,
}: {
    broadcastId: string;
    target: GeneralPublishTarget;
}) {
    const queryClient = useQueryClient();
    const [open, setOpen] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const isLive = target.status === "published";

    const toggle = async () => {
        setBusy(true);
        try {
            await articlesApi.setGeneralPublishTargetStatus(broadcastId, target.contentArticleId, !isLive);
            await queryClient.invalidateQueries({ queryKey: ["generalPublishes"] });
            await queryClient.invalidateQueries({ queryKey: ["generalPublishAudit"] });
            toast({
                variant: "success",
                title: isLive ? `Unpublished from ${target.domain}` : `Published to ${target.domain}`,
            });
            setOpen(false);
        } catch (err) {
            toast({
                variant: "error",
                title: `Couldn't ${isLive ? "unpublish from" : "publish to"} ${target.domain}`,
                description: errorMessage(err, "Please try again."),
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={`${target.domain}, ${isLive ? "published" : "not published"}. Open site actions`}
                    className={`${CHIP_BASE} ${
                        isLive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                    <span
                        aria-hidden
                        className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-500" : "border border-gray-400"}`}
                    />
                    {target.domain}
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 rounded-2xl p-2 border-gray-100 bg-white shadow-xl">
                <div className="px-3 pt-2 pb-3">
                    <p className="text-sm font-black text-gray-900 leading-tight">{target.siteName}</p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                        {isLive ? "Live on this site" : "Saved on this site, not live"}
                    </p>
                </div>
                <div className="space-y-1">
                    {isLive ? (
                        <a
                            href={liveUrl(target)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${ACTION_BASE} text-gray-700 hover:bg-gray-50`}
                        >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            Open on {target.domain}
                        </a>
                    ) : null}
                    <button
                        type="button"
                        onClick={toggle}
                        disabled={busy}
                        className={`${ACTION_BASE} ${
                            isLive ? "text-red-700 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"
                        }`}
                    >
                        {busy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isLive ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                        {isLive ? "Unpublish from this site only" : "Publish to this site only"}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function FailedSiteChip({
    broadcastId,
    failure,
}: {
    broadcastId: string;
    failure: GeneralPublishBroadcast["failedTargets"][number];
}) {
    const queryClient = useQueryClient();
    const [open, setOpen] = React.useState(false);
    const [busy, setBusy] = React.useState(false);

    const retry = async () => {
        setBusy(true);
        try {
            const { outcomes } = await articlesApi.retryGeneralPublishTenants(broadcastId, [failure.tenantId]);
            await queryClient.invalidateQueries({ queryKey: ["generalPublishes"] });
            await queryClient.invalidateQueries({ queryKey: ["generalPublishAudit"] });
            const stillFailing = outcomes.find((o) => !o.success);
            if (stillFailing) {
                toast({
                    variant: "error",
                    title: `${failure.domain} failed again`,
                    description: describeFailure(stillFailing.error ?? "unknown_error"),
                });
            } else {
                toast({ variant: "success", title: `Delivered to ${failure.domain}` });
                setOpen(false);
            }
        } catch (err) {
            toast({
                variant: "error",
                title: `Couldn't retry ${failure.domain}`,
                description: errorMessage(err, "Please try again."),
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    aria-label={`${failure.domain}, failed. Open retry options`}
                    className={`${CHIP_BASE} bg-red-50 text-red-800 border-red-200 hover:bg-red-100`}
                >
                    <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {failure.domain}
                    <span className="font-black uppercase tracking-wider text-[10px]">Failed</span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 rounded-2xl p-2 border-gray-100 bg-white shadow-xl">
                <div className="px-3 pt-2 pb-3">
                    <p className="text-sm font-black text-gray-900 leading-tight">Not delivered to {failure.domain}</p>
                    <p className="text-xs font-medium text-gray-600 mt-1 leading-relaxed">
                        {describeFailure(failure.error)}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={retry}
                    disabled={busy}
                    className={`${ACTION_BASE} text-orange-700 hover:bg-orange-50`}
                >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Retry this site
                </button>
            </PopoverContent>
        </Popover>
    );
}
