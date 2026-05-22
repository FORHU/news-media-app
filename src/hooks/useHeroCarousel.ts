"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Shared carousel state + auto-rotation for hero sections.
 * Returns the current slide index, animation direction, and navigation helpers.
 * Auto-advances every `intervalMs` when there are 2+ slides.
 */
export function useHeroCarousel(count: number, intervalMs = 5000) {
  const [[page, direction], setPage] = useState([0, 0]);
  const index = count > 0 ? ((page % count) + count) % count : 0;

  const paginate = useCallback((newDirection: number) => {
    setPage(([p]) => [p + newDirection, newDirection]);
  }, []);

  const goTo = useCallback(
    (targetIndex: number) => {
      setPage(([p]) => {
        const cur = count > 0 ? ((p % count) + count) % count : 0;
        return [targetIndex, targetIndex > cur ? 1 : -1];
      });
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => paginate(1), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs, paginate]);

  return { index, direction, paginate, goTo };
}
