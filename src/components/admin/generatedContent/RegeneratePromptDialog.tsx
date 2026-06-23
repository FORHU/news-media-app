"use client";

import React from "react";
import { FileText, ImageIcon, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PROMPT_MAX_LEN = 4000;

export type RegeneratePromptType = "text" | "image";

interface RegeneratePromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: RegeneratePromptType;
    onConfirm: (prompt: string) => void;
    isPending: boolean;
}

const COPY: Record<
    RegeneratePromptType,
    { title: string; description: string; placeholder: string; confirm: string }
> = {
    text: {
        title: "Revise article text",
        description:
            "Describe how you want the headline and body changed. This uses the article writer (/chat), not OpenAI images.",
        placeholder:
            "E.g. shorten to 3 paragraphs, lead with the policy impact, keep a neutral tone, do not change the reference line…",
        confirm: "Regenerate text",
    },
    image: {
        title: "Revise featured image",
        description:
            "Describe how the hero image should differ. This uses OpenAI Images only, not the article /chat writer.",
        placeholder:
            "E.g. wider landscape crop, less text on the graphic, cooler colors, avoid showing faces…",
        confirm: "Regenerate image",
    },
};

export default function RegeneratePromptDialog({
    open,
    onOpenChange,
    type,
    onConfirm,
    isPending,
}: RegeneratePromptDialogProps) {
    const [prompt, setPrompt] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const copy = COPY[type];
    const isText = type === "text";

    const [prevDeps, setPrevDeps] = React.useState({ open, type });
    if (open !== prevDeps.open || type !== prevDeps.type) {
        setPrevDeps({ open, type });
        if (open) {
            setPrompt("");
            setError(null);
        }
    }

    const handleConfirm = () => {
        const trimmed = prompt.trim();
        if (!trimmed) {
            setError("Please describe how you want this content revised.");
            return;
        }
        setError(null);
        onConfirm(trimmed);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[min(96vw,520px)] sm:max-w-lg rounded-2xl border border-gray-200/80 shadow-2xl p-0 gap-0 overflow-hidden">
                <div
                    className={`px-6 pt-6 pb-4 border-b ${isText ? "bg-indigo-50/80 border-indigo-100" : "bg-purple-50/80 border-purple-100"}`}
                >
                    <DialogHeader className="space-y-2 text-left">
                        <DialogTitle className="flex items-center gap-2.5 text-lg font-black text-gray-900">
                            <span
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${isText ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"}`}
                            >
                                {isText ? (
                                    <FileText className="h-5 w-5" />
                                ) : (
                                    <ImageIcon className="h-5 w-5" />
                                )}
                            </span>
                            {copy.title}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 leading-relaxed pl-[3.25rem]">
                            {copy.description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-5 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Revision instructions
                    </label>
                    <Textarea
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value.slice(0, PROMPT_MAX_LEN));
                            if (error) setError(null);
                        }}
                        placeholder={copy.placeholder}
                        className="min-h-[140px] rounded-xl resize-none bg-gray-50/80 border-gray-200 focus-visible:ring-2 focus-visible:ring-offset-0"
                        disabled={isPending}
                        autoFocus
                    />
                    <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">
                            {prompt.length} / {PROMPT_MAX_LEN}
                        </p>
                        {error ? (
                            <p className="text-xs font-medium text-red-600">{error}</p>
                        ) : null}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex-row gap-2 sm:justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="rounded-xl font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isPending}
                        className={`rounded-xl font-bold text-white shadow-sm ${isText ? "bg-indigo-600 hover:bg-indigo-700" : "bg-purple-600 hover:bg-purple-700"}`}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : isText ? (
                            <FileText className="w-4 h-4 mr-2" />
                        ) : (
                            <ImageIcon className="w-4 h-4 mr-2" />
                        )}
                        {copy.confirm}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
