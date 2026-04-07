"use client";

import React from 'react';
import {
    Zap,
    Loader2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface GenerateArticleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerate: (prompt: string) => void;
    isPending: boolean;
}

const GENERATION_PROMPT_MAX_LEN = 4000;

export default function GenerateArticleModal({
    open,
    onOpenChange,
    onGenerate,
    isPending
}: GenerateArticleModalProps) {
    const [generationPrompt, setGenerationPrompt] = React.useState('');

    // Reset prompt when opening
    React.useEffect(() => {
        if (open) setGenerationPrompt('');
    }, [open]);

    const handleGenerate = () => {
        onGenerate(generationPrompt);
        onOpenChange(false); // Close immediately as requested
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="sm:max-w-lg rounded-3xl border-gray-100">
                <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold tracking-tight">
                        Generate article
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 font-medium">
                        Add instructions for tone, angle, length, or audience. Leave blank to use the default behavior.
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    value={generationPrompt}
                    onChange={(e) =>
                        setGenerationPrompt(
                            e.target.value.slice(0, GENERATION_PROMPT_MAX_LEN)
                        )
                    }
                    placeholder="e.g. Lead with the policy impact, keep it under 400 words, neutral AP style…"
                    className="min-h-[140px] rounded-2xl border-gray-200 text-sm focus-visible:ring-orange-500/20"
                    disabled={isPending}
                />
                <div className="space-y-1">
                    <p className="text-xs text-gray-400 tabular-nums">
                        {generationPrompt.length} / {GENERATION_PROMPT_MAX_LEN}
                    </p>
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        disabled={isPending}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:opacity-95"
                        disabled={isPending}
                        onClick={handleGenerate}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Generating…
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 mr-2" />
                                Generate
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
