"use client";

import React from "react";
import { TriangleAlert } from "lucide-react";
import { detectStrayNotes } from "@/lib/generalPublishRules";

/**
 * Warns when the article still carries pasted SEO notes ("---", SEO Title,
 * Meta Description, Target Tags...) that would go live verbatim on every site,
 * and offers a one-click removal when the notes are a clean trailing block.
 */
export default function StrayNotesNotice({
    content,
    onClean,
}: {
    content: string;
    onClean: (cleaned: string) => void;
}) {
    const notes = detectStrayNotes(content);
    if (notes.found.length === 0) return null;

    return (
        <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3"
        >
            <TriangleAlert className="w-5 h-5 text-amber-700 shrink-0 hidden sm:block" aria-hidden />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-950">
                    Leftover notes found: {notes.found.join(", ")}
                </p>
                <p className="text-xs font-medium text-amber-900 mt-0.5 leading-relaxed">
                    {notes.canClean
                        ? "They sit after the article and would appear on every live site. Publishing is blocked until they're removed."
                        : "They sit inside the article text, so remove them by hand. Publishing is blocked until they're gone."}
                </p>
            </div>
            {notes.canClean ? (
                <button
                    type="button"
                    onClick={() => onClean(notes.cleaned)}
                    className="shrink-0 rounded-xl bg-amber-900 text-amber-50 hover:bg-amber-950 px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900"
                >
                    Remove notes
                </button>
            ) : null}
        </div>
    );
}
