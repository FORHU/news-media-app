"use client";

import { createContext, useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const ArticleStreamContext = createContext(false);

/** Returns true once the global SSE connection is active. */
export function useArticleStreamActive() {
  return useContext(ArticleStreamContext);
}

/**
 * Opens exactly ONE SSE connection for the entire admin session.
 * Mount this once at the AdminLayout level.
 */
export function ArticleStreamProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // In development, the SSE stream reconnect causes Next.js HMR to send a
    // full-reload signal to every browser tab (admin + landing page).
    // This is a dev-server limitation — production is unaffected.
    // Skip SSE in dev; the queries use refetchInterval as a polling fallback.
    if (process.env.NODE_ENV !== "production") return;

    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      es = new EventSource("/api/admin/stream");

      es.addEventListener("articles:updated", () => {
        queryClient.invalidateQueries({ queryKey: ["generatedArticles"] });
        queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      });

      es.addEventListener("rawArticles:updated", () => {
        queryClient.invalidateQueries({ queryKey: ["crawledArticles"] });
        queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      });

      es.addEventListener("crawlJobs:updated", () => {
        queryClient.invalidateQueries({ queryKey: ["crawlJobs"] });
        queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
      });

      es.onerror = () => {
        es.close();
        if (!unmounted) retryTimer = setTimeout(connect, 3_000);
      };
    }

    connect();

    return () => {
      unmounted = true;
      clearTimeout(retryTimer);
      es?.close();
    };
  }, [queryClient]);

  return (
    <ArticleStreamContext.Provider value={true}>
      {children}
    </ArticleStreamContext.Provider>
  );
}
