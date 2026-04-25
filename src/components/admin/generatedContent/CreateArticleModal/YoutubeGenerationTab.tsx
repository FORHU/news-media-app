import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { LANGUAGE_OPTIONS } from './ManualGenerationTab';

interface YoutubeGenerationTabProps {
    youtubeUrl: string;
    setYoutubeUrl: (val: string) => void;
    handleTranscribeYoutube: () => Promise<void>;
    isTranscribing: boolean;
    youtubeVideoId: string;
    transcriptError: string | null;
    youtubeTranscript: string;
    handleTranscriptChange: (val: string) => void;
    fieldErrors: {
        category?: string;
        topic?: string;
        transcript?: string;
    };
    youtubePrompt: string;
    setYoutubePrompt: (val: string) => void;
    language: string;
    setLanguage: (val: string) => void;
}

export default function YoutubeGenerationTab({
    youtubeUrl,
    setYoutubeUrl,
    handleTranscribeYoutube,
    isTranscribing,
    youtubeVideoId,
    transcriptError,
    youtubeTranscript,
    handleTranscriptChange,
    fieldErrors,
    youtubePrompt,
    setYoutubePrompt,
    language,
    setLanguage
}: YoutubeGenerationTabProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Language</span>
                <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-900 focus-visible:ring-orange-500/20 shadow-sm">
                        <SelectValue placeholder="English" />
                    </SelectTrigger>
                    <SelectContent>
                        {LANGUAGE_OPTIONS.map((lang) => (
                            <SelectItem key={lang} value={lang}>
                                {lang}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">YouTube URL</span>
                <div className="relative">
                    <Input
                        placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/shorts/..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="h-12 pr-[150px] rounded-xl bg-gray-50 border-gray-100 text-sm font-bold placeholder:text-gray-400 focus-visible:ring-orange-500/20 focus-visible:border-orange-200 shadow-sm"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTranscribeYoutube}
                        disabled={isTranscribing}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 rounded-lg font-bold border-gray-200 bg-white"
                    >
                        {isTranscribing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Transcribing...
                            </>
                        ) : (
                            "Transcribe"
                        )}
                    </Button>
                </div>
            </div>

            {youtubeVideoId && (
                <div className="text-xs font-bold text-gray-500">
                    Video ID: <span className="text-gray-900">{youtubeVideoId}</span>
                </div>
            )}

            {transcriptError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                    {transcriptError}
                </div>
            )}

            <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Transcribed Content</span>
                <textarea
                    value={youtubeTranscript}
                    onChange={(e) => handleTranscriptChange(e.target.value)}
                    placeholder="Transcript will appear here after transcribing."
                    className={`w-full min-h-[200px] rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-y transition-all ${
                        fieldErrors.transcript ? "border-red-500 ring-red-500/10" : "border-gray-100"
                    }`}
                />
                {fieldErrors.transcript && (
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 animate-in fade-in slide-in-from-top-1">{fieldErrors.transcript}</p>
                )}
            </div>

            <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Prompt</span>
                <textarea
                    value={youtubePrompt}
                    onChange={(e) => setYoutubePrompt(e.target.value)}
                    placeholder="Add writing instructions for the generated article (tone, length, key points, audience)."
                    className="w-full min-h-[100px] rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 resize-y"
                />
            </div>
        </div>
    );
}
