"use client";

import { useState, Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";

interface ArticleClientShellProps {
  children: React.ReactNode;
}

/**
 * Thin client boundary that owns the newsletter open/close state and renders
 * the persistent Header + Footer around server-rendered article content.
 *
 * Keeping this separate from ArticlePageClient means the article body itself
 * does not need to live inside a client component just because the Header does.
 */
export function ArticleClientShell({ children }: ArticleClientShellProps) {
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-16 bg-white border-b" />}>
        <Header onOpenNewsletter={() => setIsNewsletterOpen(true)} />
      </Suspense>
      {children}
      <Footer onOpenNewsletter={() => setIsNewsletterOpen(true)} />
      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={() => setIsNewsletterOpen(false)}
      />
    </div>
  );
}
