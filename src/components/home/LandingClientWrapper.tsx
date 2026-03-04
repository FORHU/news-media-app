"use client";

import React, { useState } from "react";
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
            <Header onOpenNewsletter={openNewsletter} />
            {children}
            <Footer onOpenNewsletter={openNewsletter} />
            <NewsletterModal
                isOpen={isNewsletterOpen}
                onClose={closeNewsletter}
            />
        </>
    );
}
