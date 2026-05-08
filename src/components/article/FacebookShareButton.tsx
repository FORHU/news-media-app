"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function FacebookShareButton({
  articleUrl,
  className,
  children,
}: {
  articleUrl?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label="Share on Facebook"
      className={cn("group w-full", className)}
      onClick={() => {
        const url = articleUrl || window.location.href;
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;

        // Server-side log so you can verify the exact URL passed to Facebook.
        // (We only print to terminal for `jejutime.com` on the server.)
        try {
          const domain = (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return "";
            }
          })();

          void fetch("/api/debug/facebook-share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({
              domain,
              pageUrl: url,
              facebookSharerUrl: shareUrl,
            }),
          });
        } catch {}

        const isMobile =
          window.matchMedia?.("(max-width: 640px)")?.matches ||
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        // Mobile browsers often block popups; open normally there.
        if (isMobile) {
          const win = window.open(shareUrl, "_blank");
          win?.focus?.();
          return;
        }

        // Centered popup for desktop-like native feel.
        const width = 600;
        const height = 400;
        const left = Math.max(
          0,
          Math.round(window.screenX + (window.outerWidth - width) / 2)
        );
        const top = Math.max(
          0,
          Math.round(window.screenY + (window.outerHeight - height) / 2)
        );

        const win = window.open(
          shareUrl,
          "facebook-share",
          `popup=yes,width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0`
        );
        win?.focus?.();
      }}
    >
      {children}
    </button>
  );
}

