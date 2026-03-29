"use client";

import React, { useState, Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NewsletterModal } from "@/components/newsLetterModal/NewsletterModal";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface LandingClientWrapperProps {
    children: React.ReactNode;
}

export function LandingClientWrapper({ children }: LandingClientWrapperProps) {
    const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
    const router = useRouter();

    const openNewsletter = () => setIsNewsletterOpen(true);
    const closeNewsletter = () => setIsNewsletterOpen(false);

    React.useEffect(() => {
        // Keep the landing page fresh when generated articles are created/updated.
        // This is event-driven: database change -> router.refresh() -> server components refetch.
        let debounce: ReturnType<typeof setTimeout> | null = null;
        const refresh = () => {
            if (debounce) clearTimeout(debounce);
            debounce = setTimeout(() => {
                debounce = null;
                router.refresh();
            }, 300);
        };

        const channel = supabase
            .channel("realtime:landing_content_articles")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "content_articles" },
                refresh
            )
            .subscribe();

        return () => {
            if (debounce) clearTimeout(debounce);
            supabase.removeChannel(channel);
        };
    }, [router]);

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
