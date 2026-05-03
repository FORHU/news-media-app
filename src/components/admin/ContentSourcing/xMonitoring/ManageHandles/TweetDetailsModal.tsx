import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { X as XIcon, Heart, Repeat2, MessageCircle, Link2, Calendar, FileType, CheckCircle2, Copy } from "lucide-react";
import type { ScrapedTweet } from "./types";

interface TweetDetailsModalProps {
    tweet: ScrapedTweet | null;
    open: boolean;
    onClose: () => void;
}

function XLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

export default function TweetDetailsModal({ tweet, open, onClose }: TweetDetailsModalProps) {
    if (!tweet) return null;

    // Filter media URLs logic
    const isMediaUrl = (url: string) => {
        const lower = url.toLowerCase();
        if (lower.match(/x\.com\/[^\/]+\/status\//) || lower.match(/twitter\.com\/[^\/]+\/status\//)) return false;
        if (lower.match(/^https?:\/\/t\.co\//)) return false;
        return true;
    };
    
    const uniqueUrls = new Map<string, string>();
    let targetUrls = Array.isArray(tweet.media_urls) ? tweet.media_urls : [];
    
    if (tweet.has_media === 'video') {
        const vUrls = targetUrls.filter(u => /\.(mp4|mov|m4v|webm|mkv|m3u8)(\?|$)/i.test(u));
        if (vUrls.length > 0) targetUrls = vUrls;
    }

    targetUrls.filter(isMediaUrl).forEach(url => {
        try {
            const parsed = new URL(url);
            let basePath = parsed.origin + parsed.pathname;
            if (parsed.hostname.includes('twimg.com') && parsed.pathname.includes('/media/')) {
                basePath = basePath.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '');
            }
            if (!uniqueUrls.has(basePath)) {
                uniqueUrls.set(basePath, url);
            } else {
                const existing = uniqueUrls.get(basePath)!;
                if (url.includes('name=large') || url.includes('name=orig') || (!existing.includes('name=large') && !existing.includes('name=orig') && url.length > existing.length)) {
                    uniqueUrls.set(basePath, url);
                }
            }
        } catch {
            if (!uniqueUrls.has(url)) uniqueUrls.set(url, url);
        }
    });

    const finalUrls = Array.from(uniqueUrls.values());

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl">
                
                {/* ── Header ── */}
                <div className="relative bg-black px-8 py-7 overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-20"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                            <XLogo className="w-7 h-7 text-black" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-black text-white tracking-tight">
                                X Post Metadata
                            </DialogTitle>
                            <DialogDescription className="text-white/60 font-medium">
                                Detailed insights and extracted media from the post.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="px-8 py-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    
                    {/* Simulated Tweet Block */}
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <XLogo className="w-6 h-6 text-gray-200" />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl overflow-hidden shadow-sm">
                                {tweet.thumbnail_url ? (
                                    <img src={tweet.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span>{tweet.source_name?.[0]?.toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-lg leading-tight">{tweet.source_name || tweet.authorName}</p>
                                <p className="text-sm font-bold text-gray-500">@{tweet.authorHandle}</p>
                            </div>
                        </div>
                        <p className="text-gray-800 text-lg whitespace-pre-wrap leading-relaxed font-medium mb-6">
                            {tweet.text}
                        </p>
                        
                        {/* Engagement Stats */}
                        <div className="flex items-center gap-8 py-4 border-t border-gray-200/60 mt-2">
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                                    <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                </div>
                                <span className="text-sm font-bold text-gray-500 group-hover:text-blue-500">{tweet.replies || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                                    <Repeat2 className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                                </div>
                                <span className="text-sm font-bold text-gray-500 group-hover:text-green-500">{tweet.retweets || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-default">
                                <div className="p-2 rounded-full group-hover:bg-pink-50 transition-colors">
                                    <Heart className="w-5 h-5 text-gray-400 group-hover:text-pink-500" />
                                </div>
                                <span className="text-sm font-bold text-gray-500 group-hover:text-pink-500">{tweet.likes || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Extracted Data Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Posted On</h4>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                                {new Date(tweet.tweet_timestamp).toLocaleString(undefined, {
                                    dateStyle: 'long',
                                    timeStyle: 'short'
                                })}
                            </p>
                        </div>
                        
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">System Status</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                    tweet.status === 'generated' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {tweet.status}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
                            <div className="flex items-center gap-2 mb-3">
                                <FileType className="w-4 h-4 text-gray-400" />
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Media Content</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                    tweet.has_media === 'video' ? 'bg-purple-100 text-purple-700' 
                                    : tweet.has_media === 'image' ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {tweet.has_media}
                                </span>
                                {tweet.media_type && (
                                    <span className="text-xs font-medium text-gray-400 truncate">
                                        ({tweet.media_type})
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <Link2 className="w-4 h-4 text-gray-400" />
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Original URLs</h4>
                            </div>
                            <div className="space-y-2">
                                <a 
                                    href={tweet.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline truncate transition-colors"
                                >
                                    <span className="truncate">View Post</span>
                                </a>
                                <a 
                                    href={tweet.profile_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 hover:underline truncate transition-colors"
                                >
                                    <span className="truncate">View Profile</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Raw Media Extracted */}
                    {(finalUrls.length > 0 || tweet.detected_image_url_or_data) && (
                        <div className="bg-gray-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                            <h4 className="text-xs font-black text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Copy className="w-4 h-4" /> 
                                Raw Extracted Media
                            </h4>

                            {tweet.detected_image_url_or_data && (
                                <div className="mb-6">
                                    <div className="rounded-2xl overflow-hidden bg-black/50 border border-white/10 max-w-sm">
                                        <img
                                            src={tweet.detected_image_url_or_data}
                                            alt="Detected media"
                                            className="w-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            {finalUrls.length > 0 && (
                                <div className="space-y-3">
                                    {finalUrls.map((mediaUrl, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 bg-white/5 p-3 rounded-xl border border-white/10">
                                            <a 
                                                href={mediaUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-xs font-mono text-blue-400 hover:text-blue-300 break-all transition-colors leading-relaxed"
                                            >
                                                {mediaUrl}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
