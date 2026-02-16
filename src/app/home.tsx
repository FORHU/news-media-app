"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { HeroSection } from "@/components/HeroSection";
import { articlesApi, adminApi } from "@/lib/api";
import type { Article } from "@/lib/types";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
    adminApi.initialize().catch(() => {});
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await articlesApi.getArticles({ limit: 50 });
      setArticles(data);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ff4500] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <NavBar />

      {articles.length > 0 ? (
        <HeroSection articles={articles.slice(0, 5)} />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-600">
          No articles found.
        </div>
      )}
    </div>
  );
}
