"use client";

import React from "react";
import { Twitter, Plus, Search, Loader2, Heart, Repeat2, ChevronLeft, ChevronRight, Zap, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import GenerateArticleFromXModal, {
  type TweetArticleGenerationMode,
} from "./generateArticleFromXModal";
// import CrawlXConfigurationModal from "./CrawlXConfigurationModal"; // TODO: Implement
// import CrawlXJobsTable from "./CrawlXJobsTable"; // TODO: Implement

type ScrapedTweet = {
  id: string;
  tweet_id: string;
  source_name: string;
  profile_url: string;
  text: string;
  tweet_timestamp: string;
  has_media: "video" | "image" | "none";
  media_type: string | null;
  media_urls: string[];
  thumbnail_url: string | null;
  status: string;
  url: string;
  createdAt: string;
  authorHandle?: string;
  authorName?: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  detected_media_kind?: string;
  detected_image_url_or_data?: string;
};

type ScrapeDebug = {
  provider?: string;
  returnedItems?: number;
  filteredItems?: number;
  requestedItems?: number;
  attempts: Array<{
    attempt?: number;
    source?: string;
    query?: string;
    returnedItems?: number;
    httpStatus?: number;
    httpError?: string;
  }>;
};

function isLikelyImageUrl(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return (
    lowerValue.startsWith("data:image/") ||
    /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?|$)/.test(lowerValue)
  );
}

function isLikelyVideoUrl(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return (
    lowerValue.startsWith("data:video/") ||
    /\.(mp4|mov|m4v|webm|mkv)(\?|$)/.test(lowerValue)
  );
}

function normalizeTweetMedia(tweet: ScrapedTweet): ScrapedTweet {
  const declaredType = (tweet.media_type ?? "").toLowerCase();
  const mediaUrls = Array.isArray(tweet.media_urls) ? tweet.media_urls : [];
  const thumbnailUrl = tweet.thumbnail_url ?? "";
  const imageFromMediaUrls = mediaUrls.find((url) => isLikelyImageUrl(url)) ?? undefined;
  const imageFromThumbnail = isLikelyImageUrl(thumbnailUrl) ? thumbnailUrl : undefined;
  const imageUrlOrData = imageFromMediaUrls ?? imageFromThumbnail;
  const hasVideoInMediaUrls = mediaUrls.some((url) => isLikelyVideoUrl(url));
  const hasVideoDeclared =
    declaredType.includes("video") ||
    declaredType.includes("animated_gif") ||
    declaredType.includes("gif");
  const hasImageDeclared = declaredType.includes("image") || declaredType.includes("photo");

  let detectedMediaKind: "image" | "video" | "none" = "none";
  if (hasVideoDeclared || hasVideoInMediaUrls) {
    detectedMediaKind = "video";
  } else if (hasImageDeclared || Boolean(imageUrlOrData)) {
    detectedMediaKind = "image";
  }

  return {
    ...tweet,
    detected_media_kind: detectedMediaKind,
    detected_image_url_or_data: imageUrlOrData,
  };
}

export default function ManageHandles() {
  const [profileUrlOrHandle, setProfileUrlOrHandle] = React.useState("");
  const [limit, setLimit] = React.useState(5);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [debug, setDebug] = React.useState<ScrapeDebug | null>(null);
  const [tweets, setTweets] = React.useState<ScrapedTweet[]>([]);
  const [selectedTweet, setSelectedTweet] = React.useState<ScrapedTweet | null>(null);
  const [selectedAuthor, setSelectedAuthor] = React.useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [isCrawlModalOpen, setIsCrawlModalOpen] = React.useState(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = React.useState(false);
  const [tweetToGenerate, setTweetToGenerate] = React.useState<ScrapedTweet | null>(null);

  const queryClient = useQueryClient();

  const generationMutation = useMutation({
    mutationFn: ({
      prompt,
      categoryId,
      language,
      generationMode,
    }: {
      prompt: string;
      categoryId: string;
      language: string;
      generationMode: TweetArticleGenerationMode;
    }) => {
      if (!tweetToGenerate) throw new Error("No tweet selected for generation");
      return articlesApi.generateAiContentFromX(
        tweetToGenerate.id,
        prompt,
        categoryId,
        language,
        generationMode
      );
    },
    onSuccess: () => {
      fetchExistingTweets();
      setIsGenerationModalOpen(false);
      setTweetToGenerate(null);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to generate article from X");
    }
  });

  async function fetchExistingTweets() {
    try {
      const response = await fetch("/api/admin/xMonitoring?limit=100");
      if (response.ok) {
        const data = await response.json();
        setTweets(data.tweets || []);
      }
    } catch (err) {
      console.error("Failed to fetch existing tweets:", err);
    } finally {
      setIsInitialLoading(false);
    }
  }

  React.useEffect(() => {
    fetchExistingTweets();
  }, []);

  // Group tweets by author handle
  const groupedByAuthor = React.useMemo(() => {
    const groups: Record<string, { name: string; handle: string; count: number; lastUpdate: string; thumbnail?: string; tweets: ScrapedTweet[] }> = {};
    
    tweets.forEach(tweet => {
      const handle = tweet.authorHandle || 'unknown';
      if (!groups[handle]) {
        groups[handle] = {
          name: tweet.source_name || tweet.authorName || handle,
          handle: handle,
          count: 0,
          lastUpdate: tweet.tweet_timestamp,
          thumbnail: tweet.thumbnail_url || undefined,
          tweets: []
        };
      }
      groups[handle].count++;
      groups[handle].tweets.push(tweet);
      if (new Date(tweet.tweet_timestamp) > new Date(groups[handle].lastUpdate)) {
        groups[handle].lastUpdate = tweet.tweet_timestamp;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime());
  }, [tweets]);

  async function handleStartCrawl() {
    if (!profileUrlOrHandle.trim()) {
      setError("Please enter an X profile URL or handle.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDebug(null);

    try {
      const response = await fetch("/api/admin/xMonitoring/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileUrlOrHandle: profileUrlOrHandle.trim(),
          limit,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        tweets?: ScrapedTweet[];
        debug?: ScrapeDebug;
      };

      if (!response.ok) {
        setDebug(data.debug ?? null);
        throw new Error(data.error ?? "Failed to scrape tweets.");
      }

      // Refresh the list from DB to ensure consistency
      fetchExistingTweets();
      setProfileUrlOrHandle(""); // Clear input on success
      setIsCrawlModalOpen(false); // Close modal on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedChannel = groupedByAuthor.find(g => g.handle === selectedAuthor);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            X Feed Sources
          </h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">
            Monitor real-time X intelligence and source viral news.
          </p>
        </div>

        <button 
          onClick={() => setIsCrawlModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 active:scale-95 group"
        >
          <Twitter className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Crawl New Feed
        </button>
      </div>

      {/* Crawl Configuration Modal */}
      <Dialog open={isCrawlModalOpen} onOpenChange={setIsCrawlModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-gray-900">Configure X Crawl</DialogTitle>
            <DialogDescription className="text-gray-500 font-medium pt-1">
              Add X handles or profile URLs to source fresh content for AI processing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Target X Profile</label>
              <input
                value={profileUrlOrHandle}
                onChange={(event) => setProfileUrlOrHandle(event.target.value)}
                placeholder="@username or https://x.com/username"
                className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Article Limit</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={limit}
                  onChange={(event) =>
                    setLimit(Math.max(1, Math.min(50, Number(event.target.value) || 5)))
                  }
                  className="w-24 h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-bold text-gray-900"
                />
                <p className="text-xs text-gray-400 font-medium">Recommended: 5-20 tweets per crawl</p>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50/50 text-red-600 px-5 py-4 text-sm font-bold animate-in slide-in-from-top-2">
                {error}
              </div>
            ) : null}

            <button
              onClick={handleStartCrawl}
              disabled={isLoading || !profileUrlOrHandle.trim()}
              className="w-full h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Feed...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Initiate X Crawl
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {selectedAuthor && selectedChannel ? (
          /* CHANNEL DETAIL VIEW */
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
             <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
               <div className="flex items-center gap-4">
                 <button 
                  onClick={() => setSelectedAuthor(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                 >
                   <ChevronLeft className="w-5 h-5 text-gray-600" />
                 </button>
                 <div>
                   <h3 className="font-bold text-gray-900">Feed: {selectedChannel.name}</h3>
                   <p className="text-xs text-blue-500 font-bold">@{selectedChannel.handle}</p>
                 </div>
               </div>
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 {selectedChannel.tweets.length} posts found
               </div>
             </div>

             <div className="divide-y divide-gray-50">
                {selectedChannel.tweets.map((tweet) => (
                  <div 
                    key={tweet.id}
                    className="group flex flex-col md:flex-row items-start md:items-center gap-4 px-8 py-5 hover:bg-blue-50/30 transition-all cursor-pointer border-l-4 border-transparent hover:border-blue-500"
                    onClick={() => setSelectedTweet(tweet)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 line-clamp-1 group-hover:text-gray-900 transition-colors">
                        {tweet.text}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                       <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTweetToGenerate(tweet);
                          setIsGenerationModalOpen(true);
                        }}
                        disabled={tweet.status === 'generated' || generationMutation.isPending}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          tweet.status === 'generated'
                          ? 'bg-green-50 text-green-600 border border-green-100 shadow-none'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95'
                        } disabled:opacity-50`}
                       >
                         {tweet.status === 'generated' ? (
                           <>
                             <Check className="w-3 h-3" />
                             Generated
                           </>
                         ) : (
                           <>
                             <Zap className="w-3 h-3" />
                             Generate
                           </>
                         )}
                       </button>

                       {tweet.has_media !== 'none' && (
                           <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${tweet.has_media === 'video' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                               {tweet.has_media}
                           </div>
                       )}
                       <div className="flex items-center gap-3 text-gray-400">
                            <div className="flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">{tweet.likes || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Repeat2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">{tweet.retweets || 0}</span>
                            </div>
                       </div>
                    </div>

                    <div className="w-28 text-right flex-shrink-0">
                       <p className="text-xs font-bold text-gray-400">
                           {new Date(tweet.tweet_timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                       </p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        ) : (
          /* MASTER SOURCE LIST VIEW */
          <>
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Connected Channels</h3>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {groupedByAuthor.length} Sources Monitored
              </div>
            </div>

            {isInitialLoading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-gray-400 font-medium italic">Scanning connected channels...</p>
              </div>
            ) : groupedByAuthor.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Twitter className="w-10 h-10 text-blue-200" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Sources Connected</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Click "Crawl New Feed" to add your first X monitoring target.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {groupedByAuthor.map((author) => (
                  <div 
                    key={author.handle}
                    className="group flex items-center gap-6 px-8 py-6 hover:bg-blue-50/40 transition-all cursor-pointer border-l-4 border-transparent hover:border-blue-500"
                    onClick={() => setSelectedAuthor(author.handle)}
                  >
                    {/* Channel Profile */}
                    <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 font-black text-xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                      {author.thumbnail ? (
                          <img src={author.thumbnail} className="w-full h-full object-cover" alt="" />
                      ) : (
                          <span>{author.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>

                    {/* Channel Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-gray-900 truncate">{author.name}</h4>
                      <p className="text-sm text-blue-500 font-bold">@{author.handle}</p>
                    </div>

                    {/* Channel Stats */}
                    <div className="flex items-center gap-8 flex-shrink-0">
                        <div className="text-center">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Captured</p>
                           <p className="text-lg font-black text-gray-900">{author.count}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Activity</p>
                           <p className="text-xs font-bold text-gray-600">
                             {new Date(author.lastUpdate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                           </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={Boolean(selectedTweet)} onOpenChange={() => setSelectedTweet(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tweet Content</DialogTitle>
            <DialogDescription>
              Full crawled tweet details from X monitoring.
            </DialogDescription>
          </DialogHeader>

          {selectedTweet ? (
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <p className="font-semibold text-gray-900">@{selectedTweet.authorHandle}</p>
                <p className="text-gray-700 mt-2 whitespace-pre-wrap">{selectedTweet.text}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                <p>
                  <span className="font-semibold">Tweet ID:</span> {selectedTweet.tweet_id}
                </p>
                <p>
                  <span className="font-semibold">Source Name:</span> {selectedTweet.source_name}
                </p>
                <p>
                  <span className="font-semibold">Timestamp:</span>{" "}
                  {selectedTweet.tweet_timestamp}
                </p>
                <p>
                  <span className="font-semibold">Status:</span> {selectedTweet.status}
                </p>
                <p>
                  <span className="font-semibold">Likes:</span> {selectedTweet.likes}
                </p>
                <p>
                  <span className="font-semibold">Retweets:</span> {selectedTweet.retweets}
                </p>
                <p>
                  <span className="font-semibold">Replies:</span> {selectedTweet.replies}
                </p>
                <p>
                  <span className="font-semibold">Has media:</span> {selectedTweet.has_media}
                </p>
                <p className="sm:col-span-2 break-all">
                  <span className="font-semibold">Profile URL:</span>{" "}
                  {selectedTweet.profile_url}
                </p>
                <p className="sm:col-span-2 break-all">
                  <span className="font-semibold">Tweet URL:</span> {selectedTweet.url}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-semibold">Media type:</span>{" "}
                  {selectedTweet.media_type ?? "N/A"}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-semibold">Detected media:</span>{" "}
                  {selectedTweet.detected_media_kind ?? "none"}
                </p>
                {selectedTweet.detected_image_url_or_data ? (
                  <p className="sm:col-span-2 break-all">
                    <span className="font-semibold">Detected image URL/Data:</span>{" "}
                    {selectedTweet.detected_image_url_or_data}
                  </p>
                ) : null}
                {selectedTweet.thumbnail_url ? (
                  <p className="sm:col-span-2 break-all">
                    <span className="font-semibold">Thumbnail URL:</span>{" "}
                    {selectedTweet.thumbnail_url}
                  </p>
                ) : null}
              </div>

              {(() => {
                const isMediaUrl = (url: string) => {
                  const lower = url.toLowerCase();
                  if (lower.match(/x\.com\/[^\/]+\/status\//) || lower.match(/twitter\.com\/[^\/]+\/status\//)) return false;
                  if (lower.match(/^https?:\/\/t\.co\//)) return false;
                  return true;
                };
                const uniqueUrls = new Map<string, string>();
                
                let targetUrls = selectedTweet.media_urls;
                if (selectedTweet.has_media === 'video') {
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

                if (finalUrls.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">Media URLs</p>
                    <div className="space-y-1">
                      {finalUrls.map((mediaUrl, index) => (
                        <p key={`${mediaUrl}-${index}`} className="break-all text-xs text-gray-600">
                          {mediaUrl}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {selectedTweet.detected_image_url_or_data ? (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Detected Image Preview</p>
                  <img
                    src={selectedTweet.detected_image_url_or_data}
                    alt="Detected tweet media"
                    className="max-h-80 w-full rounded-lg object-contain border border-gray-200 bg-white"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* <CrawlXConfigurationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["crawlXJobs"] });
        }}
      /> */}
      <GenerateArticleFromXModal
        open={isGenerationModalOpen}
        onOpenChange={setIsGenerationModalOpen}
        onGenerate={(prompt, categoryId, language, generationMode) =>
          generationMutation.mutate({ prompt, categoryId, language, generationMode })
        }
        isPending={generationMutation.isPending}
        tweetText={tweetToGenerate?.text}
        authorName={tweetToGenerate?.source_name}
      />
    </div>
  );
}
