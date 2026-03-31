"use client";

import React, { useState, Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";

interface LandingClientWrapperProps {
    children: React.ReactNode;
}

export function LandingClientWrapper({ children }: LandingClientWrapperProps) {
    const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);

    const openNewsletter = () => setIsNewsletterOpen(true);
    const closeNewsletter = () => setIsNewsletterOpen(false);

    return (
        <>
            <Suspense fallback={<div className="h-16 bg-white border-b" />}>
                <Header onOpenNewsletter={openNewsletter} />
            </Suspense>
            <Suspense fallback={<div className="min-h-screen bg-white" />}>
                {children}
                <Footer onOpenNewsletter={openNewsletter} />
            </Suspense>
            <NewsletterModal
                isOpen={isNewsletterOpen}
                onClose={closeNewsletter}
            />
        </>
    );
}
