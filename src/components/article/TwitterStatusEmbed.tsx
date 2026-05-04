"use client";

import { ExternalLink } from "lucide-react";

/** X status ids are numeric snowflakes (typically 15–22 digits). */
const STATUS_ID_RE = /^\d{10,22}$/;

function statusPermalink(
  tweetId: string,
  profileUrl?: string | null
): string | null {
  const id = tweetId.trim();
  if (STATUS_ID_RE.test(id)) {
    return `https://x.com/i/status/${id}`;
  }
  const base = profileUrl?.trim();
  if (
    base &&
    /^https?:\/\/(?:twitter\.com|x\.com)\//i.test(base)
  ) {
    return base.replace(/\/$/, "");
  }
  return null;
}

/**
 * Official X embed iframe. Requires a numeric status id — non-numeric ids
 * (e.g. placeholders from ingestion) yield “Not found” inside the iframe.
 * @see https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/overview
 */
export default function TwitterStatusEmbed({
  tweetId,
  profileUrl,
  className = "",
}: {
  tweetId: string;
  /** Used when tweetId is not a valid snowflake (fallback link only). */
  profileUrl?: string | null;
  className?: string;
}) {
  const id = tweetId.trim();

  const externalHref = statusPermalink(id, profileUrl);

  if (!id) return null;

  if (!STATUS_ID_RE.test(id)) {
    return (
      <div
        className={`w-full max-w-[550px] mx-auto rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm text-amber-950 ${className}`}
      >
        <p className="font-medium">
          Embedded post cannot be shown — the saved post id is not a valid X
          status id. Try re-crawling the post, then regenerate if needed.
        </p>
        {externalHref ? (
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
          >
            Open on X
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : null}
      </div>
    );
  }

  const src = `https://platform.twitter.com/embed/Tweet.html?id=${encodeURIComponent(id)}&theme=light`;

  return (
    <div
      className={`twitter-embed-container w-full max-w-[550px] mx-auto rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <iframe
        title="X post"
        src={src}
        className="w-full border-0"
        style={{ minHeight: 520, height: 520 }}
        scrolling="no"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <p className="sr-only">
        {externalHref ? (
          <a href={externalHref}>View this post on X</a>
        ) : null}
      </p>
    </div>
  );
}
