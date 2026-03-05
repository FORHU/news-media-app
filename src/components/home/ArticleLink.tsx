"use client";

import React, { useEffect, useRef } from "react";
import Link, { LinkProps } from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";

interface ArticleLinkProps extends LinkProps {
    articleId: string;
    children: React.ReactNode;
    className?: string;
}

export function ArticleLink({
    articleId,
    children,
    className,
    ...props
}: ArticleLinkProps) {
    const queryClient = useQueryClient();
    const ref = useRef<HTMLAnchorElement>(null);
    const prefetched = useRef(false);

    useEffect(() => {
        if (!articleId || !ref.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && !prefetched.current) {
                    prefetched.current = true;
                    queryClient.prefetchQuery({
                        queryKey: ["article", articleId],
                        queryFn: () => articlesApi.getArticle(articleId),
                        staleTime: 5 * 60 * 1000, // 5 minutes
                    });
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" } // Start prefetching 200px before it enters the viewport
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [articleId, queryClient]);

    return (
        <Link
            {...props}
            ref={ref}
            className={className}
        >
            {children}
        </Link>
    );
}
