"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";
import JejuTimeHeader from "./sites/jejutime/JejuTimeHeader";
import JejuTimeFooter from "./sites/jejutime/JejuTimeFooter";
import JejuQQHeader from "./sites/jejuqq/JejuQQHeader";
import JejuQQFooter from "./sites/jejuqq/JejuQQFooter";
import JejuJapanHeader from "./sites/jejujapan/JejuJapanHeader";
import JejuJapanFooter from "./sites/jejujapan/JejuJapanFooter";

interface ArticleClientShellProps {
  children: React.ReactNode;
}

export function ArticleClientShell({ children }: ArticleClientShellProps) {
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [domain, setDomain] = useState<string>("");

  useEffect(() => {
    setDomain(window.location.hostname);
  }, []);

  const isJejuTime = domain.includes("jejutime");
  const isJejuQQ = domain.includes("jejuqq");
  const isJejuJapan = domain.includes("jejujapan");
  const openNewsletter = () => setIsNewsletterOpen(true);
  const closeNewsletter = () => setIsNewsletterOpen(false);

  return (
    <div className="min-h-screen bg-white">
      {isJejuTime ? (
        <JejuTimeHeader onOpenNewsletter={openNewsletter} />
      ) : isJejuQQ ? (
        <JejuQQHeader onOpenNewsletter={openNewsletter} />
      ) : isJejuJapan ? (
        <JejuJapanHeader onOpenNewsletter={openNewsletter} />
      ) : (
        <Header onOpenNewsletter={openNewsletter} />
      )}
      
      {children}
      
      {isJejuTime ? (
        <JejuTimeFooter onOpenNewsletter={openNewsletter} />
      ) : isJejuQQ ? (
        <JejuQQFooter onOpenNewsletter={openNewsletter} />
      ) : isJejuJapan ? (
        <JejuJapanFooter onOpenNewsletter={openNewsletter} />
      ) : (
        <Footer onOpenNewsletter={openNewsletter} />
      )}

      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={closeNewsletter}
        domain={domain}
      />
    </div>
  );
}

