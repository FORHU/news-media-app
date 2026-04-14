"use client";

import React from "react";
import Link, { LinkProps } from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { articlesApi } from "@/lib/api";

interface ArticleLinkProps extends LinkProps {
    articleIdentifier: string;
    children: React.ReactNode;
    className?: string;
}

export function ArticleLink({
    articleIdentifier,
    children,
    className,
    ...props
}: ArticleLinkProps) {
    const queryClient = useQueryClient();

    const handleMouseEnter = () => {
        if (articleIdentifier) {
            void queryClient.prefetchQuery({
                queryKey: ["article", articleIdentifier],
                queryFn: () => articlesApi.getArticle(articleIdentifier),
                staleTime: 5 * 60 * 1000,
            });
        }
    };

    return (
        <Link
            {...props}
            className={className}
            onMouseEnter={handleMouseEnter}
        >
            {children}
        </Link>
    );
}
