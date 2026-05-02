"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";

// Lazy load domain-specific components with SSR enabled
const NewsIconsHeader = dynamic(() => import("./sites/newsicons/NewsIconsHeader"), { ssr: true });
const NewsIconsFooter = dynamic(() => import("./sites/newsicons/NewsIconsFooter"), { ssr: true });
const JejuTimeHeader = dynamic(() => import("./sites/jejutime/JejuTimeHeader"), { ssr: true });
const JejuTimeFooter = dynamic(() => import("./sites/jejutime/JejuTimeFooter"), { ssr: true });
const JejuQQHeader = dynamic(() => import("./sites/jejuqq/JejuQQHeader"), { ssr: true });
const JejuQQFooter = dynamic(() => import("./sites/jejuqq/JejuQQFooter"), { ssr: true });
const JejuJapanHeader = dynamic(() => import("./sites/jejujapan/JejuJapanHeader"), { ssr: true });
const JejuJapanFooter = dynamic(() => import("./sites/jejujapan/JejuJapanFooter"), { ssr: true });

// Fallbacks
const DefaultHeader = dynamic(() => import("./Header").then(m => m.Header), { ssr: true });
const DefaultFooter = dynamic(() => import("./Footer").then(m => m.Footer), { ssr: true });

interface SiteShellProps {
  children: React.ReactNode;
  domain: string;
  footerBanners?: any[];
}

export function SiteShell({ children, domain, footerBanners }: SiteShellProps) {
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const openNewsletter = () => setIsNewsletterOpen(true);
  const closeNewsletter = () => setIsNewsletterOpen(false);

  const site = useMemo(() => {
    const d = domain.toLowerCase();
    if (d.includes("jejutime")) return "jejutime";
    if (d.includes("jejuqq")) return "jejuqq";
    if (d.includes("jejujapan")) return "jejujapan";
    if (d.includes("newsicons")) return "newsicons";
    return "default";
  }, [domain]);

  const renderHeader = () => {
    switch (site) {
      case "jejutime": return <JejuTimeHeader onOpenNewsletter={openNewsletter} />;
      case "jejuqq": return <JejuQQHeader onOpenNewsletter={openNewsletter} />;
      case "jejujapan": return <JejuJapanHeader onOpenNewsletter={openNewsletter} />;
      case "newsicons": return <NewsIconsHeader onOpenNewsletter={openNewsletter} />;
      default: return <DefaultHeader onOpenNewsletter={openNewsletter} />;
    }
  };

  const renderFooter = () => {
    switch (site) {
      case "jejutime": return <JejuTimeFooter onOpenNewsletter={openNewsletter} />;
      case "jejuqq": return <JejuQQFooter onOpenNewsletter={openNewsletter} />;
      case "jejujapan": return <JejuJapanFooter onOpenNewsletter={openNewsletter} />;
      case "newsicons": return <NewsIconsFooter onOpenNewsletter={openNewsletter} footerBanners={footerBanners} />;
      default: return <DefaultFooter onOpenNewsletter={openNewsletter} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <React.Suspense fallback={<div className="h-14 md:h-16 bg-white border-b border-gray-100" />}>
        {renderHeader()}
      </React.Suspense>
      <main className="flex-1">{children}</main>
      <React.Suspense fallback={<div className="h-48 bg-gray-50" />}>
        {renderFooter()}
      </React.Suspense>
      <NewsletterModal isOpen={isNewsletterOpen} onClose={closeNewsletter} domain={domain} />
    </div>
  );
}
