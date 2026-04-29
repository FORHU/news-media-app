"use client";

import React from "react";
import { Twitter, Plus, Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import CrawlXConfigurationModal from "./CrawlXConfigurationModal"; // TODO: Implement
// import CrawlXJobsTable from "./CrawlXJobsTable"; // TODO: Implement

type ScrapedTweet = {
  id: string;
  tweet_id: string;
  source_name: string;
  profile_url: string;
  text: string;
  tweet_timestamp: string;
  has_media: boolean;
  media_type: string | null;
  media_urls: string[];
  thumbnail_url: string | null;
  status: string;
  url: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  authorHandle: string;
  authorName: string;
};

type ScrapeDebugAttempt = {
  attempt?: number;
  input?: Record<string, unknown>;
  source?: string;
  query?: string;
  returnedItems?: number;
  sampleKeys?: string[];
  httpStatus?: number;
  httpError?: string;
  noResults?: boolean;
};

type ScrapeDebug = {
  provider?: string;
  actorId?: string;
  requestedHandle?: string;
  attempts?: ScrapeDebugAttempt[];
  selectedAttempt?: Record<string, unknown> | null;
  returnedItems?: number;
  filteredItems?: number;
  requestedItems?: number;
  actorRequestedItems?: number;
  sampleKeys?: string[];
};

export default function ManageHandles() {
  const [profileUrlOrHandle, setProfileUrlOrHandle] = React.useState("");
  const [limit, setLimit] = React.useState(5);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [debug, setDebug] = React.useState<ScrapeDebug | null>(null);
  const [tweets, setTweets] = React.useState<ScrapedTweet[]>([]);
  const [selectedTweet, setSelectedTweet] = React.useState<ScrapedTweet | null>(null);

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

      setTweets(Array.isArray(data.tweets) ? data.tweets : []);
      setDebug(data.debug ?? null);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Something went wrong.";
      setTweets([]);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          X Monitoring
        </h1>
        <p className="text-gray-500 font-medium">
          Configure X profiles and keywords to crawl for AI content generation
        </p>
      </div>

      {/* X Crawler Configuration Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Twitter className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Monitoring Configuration
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              Add X handles or search terms to monitor for new content
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3">
          <input
            value={profileUrlOrHandle}
            onChange={(event) => setProfileUrlOrHandle(event.target.value)}
            placeholder="@username or https://x.com/username"
            className="h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="number"
            min={1}
            max={50}
            value={limit}
            onChange={(event) =>
              setLimit(Math.max(1, Math.min(50, Number(event.target.value) || 5)))
            }
            className="h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleStartCrawl}
            disabled={isLoading || !profileUrlOrHandle.trim()}
            className="h-11 flex items-center justify-center gap-2 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Start X Crawl
              </>
            )}
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        {debug?.attempts && debug.attempts.length > 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 space-y-2">
            <p className="font-semibold">
              Crawl debug details ({(debug.provider ?? "x").toUpperCase()})
            </p>
            <p className="text-[11px] text-amber-800">
              Returned: {debug.returnedItems ?? 0}
              {typeof debug.filteredItems === "number"
                ? ` | Filtered: ${debug.filteredItems}`
                : ""}
              {typeof debug.requestedItems === "number"
                ? ` | Requested: ${debug.requestedItems}`
                : ""}
            </p>
            {debug.attempts.map((attempt, index) => (
              <div
                key={`${attempt.attempt ?? index}-${attempt.source ?? "attempt"}`}
                className="border-t border-amber-200 pt-2"
              >
                <p>
                  {attempt.source
                    ? `${attempt.source}${attempt.query ? ` (${attempt.query})` : ""}`
                    : `Attempt ${attempt.attempt ?? index + 1}`}
                  :{" "}
                  {attempt.httpStatus
                    ? `HTTP ${attempt.httpStatus}`
                    : `${attempt.returnedItems ?? 0} items`}
                </p>
                {attempt.httpError ? <p className="break-all">{attempt.httpError}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
        {tweets.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No X Crawl Results Yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Enter an X profile URL or handle, choose a tweet limit, then start crawl.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tweets.map((tweet) => (
              <button
                key={tweet.id}
                onClick={() => setSelectedTweet(tweet)}
                className="block rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
              >
                <p className="font-semibold text-gray-900">@{tweet.authorHandle}</p>
                <p className="text-gray-700 mt-1 line-clamp-3">{tweet.text}</p>
                <p className="text-xs text-gray-500 mt-2">
                  ❤️ {tweet.likes} · 🔁 {tweet.retweets} · 💬 {tweet.replies}
                </p>
              </button>
            ))}
          </div>
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
                  <span className="font-semibold">Has media:</span>{" "}
                  {selectedTweet.has_media ? "Yes" : "No"}
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
                {selectedTweet.thumbnail_url ? (
                  <p className="sm:col-span-2 break-all">
                    <span className="font-semibold">Thumbnail URL:</span>{" "}
                    {selectedTweet.thumbnail_url}
                  </p>
                ) : null}
              </div>

              {selectedTweet.media_urls.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Media URLs</p>
                  <div className="space-y-1">
                    {selectedTweet.media_urls.map((mediaUrl, index) => (
                      <p key={`${mediaUrl}-${index}`} className="break-all text-xs text-gray-600">
                        {mediaUrl}
                      </p>
                    ))}
                  </div>
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
    </div>
  );
}
