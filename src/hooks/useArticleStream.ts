"use client";

/**
 * No-op. The SSE connection is now managed globally by ArticleStreamProvider
 * in AdminLayout — one connection for the entire admin session.
 * Call sites are kept as-is to avoid churn.
 */
export function useArticleStream() {}
