"use client";

import { Footer } from "@/components/Footer";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string | null;
  positions: string[];
}

interface NewsIconsFooterProps {
  onOpenNewsletter?: () => void;
  footerBanners?: Banner[];
}

export default function NewsIconsFooter({ onOpenNewsletter, footerBanners }: NewsIconsFooterProps) {
  return (
    <Footer onOpenNewsletter={onOpenNewsletter} />
  );
}
