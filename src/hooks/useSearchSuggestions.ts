"use client";

import { useState, useEffect } from "react";
import { articlesApi } from "@/lib/api";
import type { Article } from "@/lib/types";

export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      // Reset guard: clear suggestions immediately when query empties out.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowSuggestions(true);
      try {
        const results = await articlesApi.getArticles({ limit: 5, search: query });
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const hideSuggestions = () => {
    // Short delay so clicks on suggestion items register before blur hides the list
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return { suggestions, isSearching, showSuggestions, setShowSuggestions, hideSuggestions };
}
