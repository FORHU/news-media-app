"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useArticleStream() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const es = new EventSource("/api/admin/stream");

    es.addEventListener("articles:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["generatedArticles"] });
    });

    es.addEventListener("rawArticles:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["crawledArticles"] });
    });

    es.addEventListener("crawlJobs:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["crawlJobs"] });
    });

    es.onerror = () => {
      // Browser auto-reconnects on error — no manual retry needed
    };

    return () => es.close();
  }, [queryClient]);
}
