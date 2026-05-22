"use client";

import { Footer } from "@/components/Footer";

interface NewsIconsFooterProps {
  onOpenNewsletter?: () => void;
}

export default function NewsIconsFooter({ onOpenNewsletter }: NewsIconsFooterProps) {
  return (
    <Footer onOpenNewsletter={onOpenNewsletter} />
  );
}
