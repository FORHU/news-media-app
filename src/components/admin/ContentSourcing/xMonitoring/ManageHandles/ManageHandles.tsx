"use client";

import React from "react";
import Image from "next/image";
import { Plus, Loader2, Heart, Repeat2, ChevronLeft, ChevronRight, Zap, Check, X as XIcon, Search, Filter } from "lucide-react";

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";
import Pagination from "@/components/admin/pagination";

import TweetDetailsModal from "./TweetDetailsModal";
import TransformXPostModal, { type TweetArticleGenerationMode } from "./TransformXPostModal";
import type { ScrapedTweet } from "./types";

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

export default function ManageHandles() {
  const [profileUrlOrHandle, setProfileUrlOrHandle] = React.useState("");
  const [limit, setLimit] = React.useState(5);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [, setDebug] = React.useState<ScrapeDebug | null>(null);
  const [selectedAuthor, setSelectedAuthor] = React.useState<string | null>(null);
  const [isCrawlModalOpen, setIsCrawlModalOpen] = React.useState(false);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = React.useState(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = React.useState(false);
  const [selectedTweet, setSelectedTweet] = React.useState<ScrapedTweet | null>(null);
  const [channelPage, setChannelPage] = React.useState(1);
  const CHANNELS_PER_PAGE = 5;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState<"recent" | "count" | "name">("recent");
  const [postFilter, setPostFilter] = React.useState<"all" | "pending" | "generated">("all");

  const queryClient = useQueryClient();

  const { data: tweetsData, isLoading: isInitialLoading } = useQuery({
    queryKey: ['xMonitoringTweets'],
    queryFn: async () => {
      const response = await fetch("/api/admin/xMonitoring?limit=100");
      if (!response.ok) throw new Error("Failed to fetch tweets");
      const data = await response.json();
      return (data.tweets || []) as ScrapedTweet[];
    }
  });

  const tweets = React.useMemo(() => tweetsData || [], [tweetsData]);

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
      if (!selectedTweet) throw new Error("No tweet selected for generation");
      return articlesApi.generateAiContentFromX(
        selectedTweet.id,
        prompt,
        categoryId,
        language,
        generationMode
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xMonitoringTweets'] });
      setIsGenerationModalOpen(false);
      setSelectedTweet(null);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to generate article from X");
    }
  });

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
      queryClient.invalidateQueries({ queryKey: ['xMonitoringTweets'] });
      setProfileUrlOrHandle(""); // Clear input on success
      setIsCrawlModalOpen(false); // Close modal on success
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  const selectedChannel = groupedByAuthor.find(g => g.handle === selectedAuthor);

  const filteredAndSortedTweets = React.useMemo(() => {
    if (!selectedChannel) return [];
    
    let result = selectedChannel.tweets;
    
    if (postFilter === "pending") {
      result = result.filter(t => t.status !== "generated");
    } else if (postFilter === "generated") {
      result = result.filter(t => t.status === "generated");
    }
    
    return [...result].sort((a, b) => {
      const aGen = a.status === "generated";
      const bGen = b.status === "generated";
      if (aGen && !bGen) return 1;
      if (!aGen && bGen) return -1;
      return new Date(b.tweet_timestamp).getTime() - new Date(a.tweet_timestamp).getTime();
    });
  }, [selectedChannel, postFilter]);

  const filteredAndSortedChannels = React.useMemo(() => {
    let result = groupedByAuthor;
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(lowerQuery) || 
        a.handle.toLowerCase().includes(lowerQuery)
      );
    }

    result = [...result].sort((a, b) => {
      if (sortOrder === "count") {
        return b.count - a.count;
      }
      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
    });

    return result;
  }, [groupedByAuthor, searchQuery, sortOrder]);

  // Reset pagination when search or sort changes — during render, no effect.
  const [prevFilters, setPrevFilters] = React.useState({ searchQuery, sortOrder });
  if (searchQuery !== prevFilters.searchQuery || sortOrder !== prevFilters.sortOrder) {
    setPrevFilters({ searchQuery, sortOrder });
    setChannelPage(1);
  }

  const totalChannelPages = Math.ceil(filteredAndSortedChannels.length / CHANNELS_PER_PAGE);
  const paginatedChannels = filteredAndSortedChannels.slice(
    (channelPage - 1) * CHANNELS_PER_PAGE,
    channelPage * CHANNELS_PER_PAGE
  );

  // Rendering main view
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
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-900 transition-all shadow-lg shadow-black/20 active:scale-95 group"
        >
          <XLogo className="w-4 h-4" />
          Crawl New Feed
        </button>
      </div>

      {/* Crawl Configuration Modal */}
      <Dialog open={isCrawlModalOpen} onOpenChange={setIsCrawlModalOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          {/* Modal Header */}
          <div className="relative bg-black px-8 py-7">
            <button
              onClick={() => setIsCrawlModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <XIcon className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                <XLogo className="w-6 h-6 text-black" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-white">Crawl X Feed</DialogTitle>
                <DialogDescription className="text-white/50 font-medium text-sm">
                  Add an X handle or profile URL to source content.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-8 py-7 space-y-5 bg-white">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Target X Profile</label>
              <input
                value={profileUrlOrHandle}
                onChange={(event) => setProfileUrlOrHandle(event.target.value)}
                placeholder="@username or https://x.com/username"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all font-medium text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Post Limit</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={limit}
                  onChange={(event) =>
                    setLimit(Math.max(1, Math.min(50, Number(event.target.value) || 5)))
                  }
                  className="w-24 h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all font-bold text-gray-900"
                />
                <p className="text-xs text-gray-400 font-medium">Recommended: 5–20 posts per crawl</p>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-100 bg-red-50 text-red-600 px-4 py-3 text-sm font-bold animate-in slide-in-from-top-2">
                {error}
              </div>
            ) : null}

            <button
              onClick={handleStartCrawl}
              disabled={isLoading || !profileUrlOrHandle.trim()}
              className="w-full h-12 flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white rounded-xl font-black text-sm shadow-xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
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
            <div className="px-8 py-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedAuthor(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h3 className="font-bold text-gray-900">Feed: {selectedChannel.name}</h3>
                  <p className="text-xs text-gray-500 font-bold">@{selectedChannel.handle}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={postFilter}
                    onChange={(e) => setPostFilter(e.target.value as "all" | "pending" | "generated")}
                    className="py-1.5 pl-3 pr-8 rounded-xl border border-gray-200 bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all text-xs font-bold text-gray-700 appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                  >
                    <option value="all">All Posts</option>
                    <option value="pending">Pending Only</option>
                    <option value="generated">Generated Only</option>
                  </select>
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                  {filteredAndSortedTweets.length} posts
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {filteredAndSortedTweets.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-900 font-bold text-lg mb-1">No posts found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your filter.</p>
                </div>
              ) : (
                filteredAndSortedTweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className="group flex flex-col md:flex-row items-start md:items-center gap-4 px-8 py-5 hover:bg-gray-50 transition-all cursor-pointer border-l-4 border-transparent hover:border-gray-900"
                  onClick={() => { setSelectedTweet(tweet); setIsMetadataModalOpen(true); }}
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
                        setSelectedTweet(tweet);
                        setIsGenerationModalOpen(true);
                      }}
                      disabled={tweet.status === 'generated' || generationMutation.isPending}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          tweet.status === 'generated'
                          ? 'bg-green-50 text-green-600 border border-green-100 shadow-none'
                          : 'bg-black text-white shadow-lg shadow-black/20 hover:scale-105 active:scale-95'
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
                      <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${tweet.has_media === 'video' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-700'}`}>
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
                ))
              )}
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

            {/* Filter Bar */}
            <div className="px-8 py-4 bg-white border-b border-gray-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "recent" | "count" | "name")}
                  className="flex-1 sm:flex-none py-2 pl-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20 transition-all text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                >
                  <option value="recent">Sort by Latest Activity</option>
                  <option value="count">Sort by Most Captured</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
            </div>

            {isInitialLoading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-gray-900 animate-spin" />
                <p className="text-gray-400 font-medium italic">Scanning connected channels...</p>
              </div>
            ) : groupedByAuthor.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <XLogo className="w-9 h-9 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Sources Connected</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Click &quot;Crawl New Feed&quot; to add your first X monitoring target.
                </p>
              </div>
            ) : (
              <div>
                <div className="px-6 py-4 space-y-3 min-h-[520px]">
                  {paginatedChannels.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-900 font-bold text-lg mb-1">No channels found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your search filters.</p>
                    </div>
                  ) : (
                    paginatedChannels.map((author) => (
                    <div
                      key={author.handle}
                      className="group flex items-center gap-6 px-6 py-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
                      onClick={() => setSelectedAuthor(author.handle)}
                    >
                      {/* Channel Profile */}
                      <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-black text-xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 relative">
                        {author.thumbnail ? (
                          <Image src={author.thumbnail} fill sizes="56px" className="object-cover" alt="" />
                        ) : (
                          <span>{author.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>

                      {/* Channel Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-black text-gray-900 truncate">{author.name}</h4>
                        <p className="text-sm text-gray-500 font-bold">@{author.handle}</p>
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
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                      </div>
                    </div>
                  )))}
                </div>

                {/* Channel Pagination */}
                <Pagination
                  currentPage={channelPage}
                  totalPages={totalChannelPages}
                  onPageChange={setChannelPage}
                  activeColor="black"
                />
              </div>
            )}
          </>
        )}
      </div>

      <TweetDetailsModal
        tweet={selectedTweet}
        open={isMetadataModalOpen}
        onClose={() => {
          setIsMetadataModalOpen(false);
          setSelectedTweet(null);
        }}
      />

      <TransformXPostModal
        open={isGenerationModalOpen}
        onOpenChange={setIsGenerationModalOpen}
        onGenerate={(prompt, categoryId, language, generationMode) =>
          generationMutation.mutate({ prompt, categoryId, language, generationMode })
        }
        isPending={generationMutation.isPending}
        tweetText={selectedTweet?.text}
        authorName={selectedTweet?.source_name || selectedTweet?.authorName}
        tweetUrl={selectedTweet?.url}
      />
    </div>
  );
}
