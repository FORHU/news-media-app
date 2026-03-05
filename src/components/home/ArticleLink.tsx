"use client";

import React from "react";
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

    const handleMouseEnter = () => {
        if (articleId) {
            queryClient.prefetchQuery({
                queryKey: ["article", articleId],
                queryFn: () => articlesApi.getArticle(articleId),
                staleTime: 5 * 60 * 1000, // 5 minutes
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
