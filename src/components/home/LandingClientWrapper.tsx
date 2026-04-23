"use client";

import React, { useState, Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";

interface Banner {
    id: string;
    imageUrl: string;
    linkUrl: string;
    altText: string | null;
    position: string;
}

interface LandingClientWrapperProps {
    children: React.ReactNode;
    footerBanners?: Banner[];
}

export function LandingClientWrapper({ children, footerBanners }: LandingClientWrapperProps) {
    const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

    const openNewsletter = () => setIsNewsletterOpen(true);
    const closeNewsletter = () => setIsNewsletterOpen(false);

    return (
        <>
            <Suspense fallback={<div className="h-16 bg-white border-b" />}>
                <Header onOpenNewsletter={openNewsletter} />
            </Suspense>
            {children}
            <Footer onOpenNewsletter={openNewsletter} footerBanners={footerBanners} />
            <NewsletterModal
                isOpen={isNewsletterOpen}
                onClose={closeNewsletter}
            />
        </>
    );
}
