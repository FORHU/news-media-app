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
            "Describe how you want the headline and body changed. This runs through the article writer (/chat), not OpenAI image generation.",
        placeholder:
            "E.g. shorten to 3 paragraphs, lead with the policy impact, keep a neutral tone, do not change the reference line…",
        confirm: "Regenerate text",
    },
    image: {
        title: "Revise featured image",
        description:
            "Describe how the hero image should differ. This runs through OpenAI Images only (edits or DALL·E 3), not the article /chat writer.",
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

    React.useEffect(() => {
        if (open) {
            setPrompt("");
            setError(null);
        }
    }, [open, type]);

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
            <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black">
                        {type === "text" ? (
                            <FileText className="w-5 h-5 text-indigo-600" />
                        ) : (
                            <ImageIcon className="w-5 h-5 text-purple-600" />
                        )}
                        {copy.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-600 leading-relaxed">
                        {copy.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <Textarea
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value.slice(0, PROMPT_MAX_LEN));
                            if (error) setError(null);
                        }}
                        placeholder={copy.placeholder}
                        className="min-h-[120px] rounded-xl resize-none"
                        disabled={isPending}
                        autoFocus
                    />
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 tabular-nums">
                            {prompt.length} / {PROMPT_MAX_LEN}
                        </p>
                        {error ? (
                            <p className="text-xs font-medium text-red-600">{error}</p>
                        ) : null}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isPending}
                        className={
                            type === "text"
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-purple-600 hover:bg-purple-700"
                        }
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : type === "text" ? (
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
