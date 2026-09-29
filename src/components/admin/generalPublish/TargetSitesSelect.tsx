"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { articlesApi } from "@/lib/api";

interface TargetSitesSelectProps {
    value: string[];
    onChange: (ids: string[]) => void;
    error?: string;
    disabled?: boolean;
}

/**
 * Picks which sites a broadcast goes to. Nothing is preselected on purpose:
 * publishing the same story to several domains creates duplicate content, so
 * "all sites" has to be a deliberate choice.
 */
export default function TargetSitesSelect({ value, onChange, error, disabled }: TargetSitesSelectProps) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["generalPublishTargets"],
        queryFn: () => articlesApi.getGeneralPublishTargets(),
        staleTime: 5 * 60 * 1000,
    });

    const targets = data?.targets ?? [];
    const allSelected = targets.length > 0 && value.length === targets.length;

    const toggle = (id: string) => {
        onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Target sites <span className="text-red-500">*</span>
                </span>
                {targets.length > 0 && (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(allSelected ? [] : targets.map((t) => t.id))}
                        className="text-[11px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 disabled:opacity-50"
                    >
                        {allSelected ? "Clear" : "Select all"}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading sites...
                </div>
            ) : isError ? (
                <p className="text-sm font-bold text-red-600">Could not load sites. Close and reopen this dialog.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {targets.map((t) => {
                        const checked = value.includes(t.id);
                        return (
                            <label
                                key={t.id}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                                    checked ? "border-orange-300 bg-orange-50 text-gray-900" : "border-gray-100 bg-gray-50 text-gray-600"
                                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => toggle(t.id)}
                                    className="accent-orange-500"
                                />
                                <span className="truncate">{t.domain}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {value.length > 1 && (
                <p className="text-[11px] text-gray-500 ml-1">
                    Each site gets its own reworded version, framed for that site&apos;s beat. If rewriting fails for a
                    site, its copy is saved as a draft instead of being published.
                </p>
            )}
            {error && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">{error}</p>
            )}
        </div>
    );
}
