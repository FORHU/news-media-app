"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";
import JejuTimeHeader from "../sites/jejutime/JejuTimeHeader";
import JejuTimeFooter from "../sites/jejutime/JejuTimeFooter";
import JejuQQHeader from "../sites/jejuqq/JejuQQHeader";
import JejuQQFooter from "../sites/jejuqq/JejuQQFooter";
import JejuJapanHeader from "../sites/jejujapan/JejuJapanHeader";
import JejuJapanFooter from "../sites/jejujapan/JejuJapanFooter";

interface Banner {
    id: string;
    imageUrl: string;
    linkUrl: string;
    altText: string | null;
    positions: string[];
}

interface LandingClientWrapperProps {
    children: React.ReactNode;
    footerBanners?: Banner[];
}

export function LandingClientWrapper({ children, footerBanners }: LandingClientWrapperProps) {
    const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
    const [domain, setDomain] = useState<string>("");

    useEffect(() => {
        setDomain(window.location.hostname);
    }, []);

    const openNewsletter = () => setIsNewsletterOpen(true);
    const closeNewsletter = () => setIsNewsletterOpen(false);

    const isJejuTime = domain.includes("jejutime");
    const isJejuQQ = domain.includes("jejuqq");
    const isJejuJapan = domain.includes("jejujapan");

    return (
        <>
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
                <Footer onOpenNewsletter={openNewsletter} footerBanners={footerBanners} />
            )}

            <NewsletterModal
                isOpen={isNewsletterOpen}
                onClose={closeNewsletter}
                domain={domain}
            />
        </>
    );
}

