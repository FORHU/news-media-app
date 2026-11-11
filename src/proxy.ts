import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";
import { acceptsMarkdown } from "@/lib/htmlToMarkdown";
import { TENANT_DOMAIN_COOKIE, getTenantDomainFromRequest, getSiteLogoFromDomain, getSiteIconFromDomain } from "@/lib/tenant";
import { resolveRetiredArticle, goneResponseHtml } from "@/lib/retiredArticles";
import { canonicalHostRedirect, visitorScheme, legacyCategoryRedirect, isAdminPath } from "@/lib/edgeRedirects";

const ADMIN_ROBOTS_TAG = "noindex, nofollow";

/**
 * Entry point. Order matters:
 *  1. http:// and www. -> https apex (301, path + query preserved)
 *  2. retired article slugs -> 301 to a live replacement, else 410
 *  3. legacy /?cat= and /?category= -> the search facet (301)
 *  4. everything else (tenant rewrite, admin auth) in handleRequest()
 * Every /admin/* response (pages, redirects, API) gets X-Robots-Tag noindex.
 */
export async function proxy(request: NextRequest) {
    const { pathname, search, searchParams } = request.nextUrl;
    const isReadOnlyMethod = request.method === "GET" || request.method === "HEAD";

    if (isReadOnlyMethod) {
        const hostRedirect = canonicalHostRedirect({
            host: request.headers.get("host"),
            proto: visitorScheme(request.headers),
            pathname,
            search,
        });
        if (hostRedirect) return NextResponse.redirect(hostRedirect, 301);

        if (!isAdminPath(pathname)) {
            const tenantDomain = getTenantDomainFromRequest(request);
            const retired = resolveRetiredArticle(tenantDomain, pathname);
            if (retired?.status === 301) {
                return NextResponse.redirect(new URL(retired.location, request.url), 301);
            }
            if (retired?.status === 410) {
                return new NextResponse(request.method === "HEAD" ? null : goneResponseHtml(), {
                    status: 410,
                    headers: {
                        "content-type": "text/html; charset=utf-8",
                        "x-robots-tag": "noindex",
                        "cache-control": "public, max-age=0, s-maxage=3600",
                    },
                });
            }

            const facet = legacyCategoryRedirect(pathname, searchParams);
            if (facet) return NextResponse.redirect(new URL(facet, request.url), 301);
        }
    }

    const response = await handleRequest(request);
    if (isAdminPath(pathname) || pathname.startsWith("/api/admin")) {
        response.headers.set("X-Robots-Tag", ADMIN_ROBOTS_TAG);
    }
    return response;
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
    try {
        const { pathname } = request.nextUrl;
        const isAdminPage = pathname.startsWith("/admin");
        const isAdminApi = pathname.startsWith("/api/admin");
        const isAdminLogin = pathname === "/admin/login";
        const isAdminAuthApi = pathname.startsWith("/api/admin/auth/");

        // Tenant scoping (domain-based).
        const tenantDomain = getTenantDomainFromRequest(request);

        // Create initial response
        const response = NextResponse.next({ request });

        if (tenantDomain) {
            response.cookies.set(TENANT_DOMAIN_COOKIE, tenantDomain, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.COOKIE_SECURE === "true",
                path: "/",
            });
        }

        // 1. PUBLIC ROUTE REWRITING
        if (pathname === "/logo.png") {
            const url = request.nextUrl.clone();
            const logoFile = getSiteLogoFromDomain(tenantDomain);
            url.pathname = `/Logo/${logoFile}`;
            return NextResponse.rewrite(url);
        }

        if (pathname === "/favicon.ico") {
            const url = request.nextUrl.clone();
            const iconFile = getSiteIconFromDomain(tenantDomain);
            url.pathname = iconFile;
            return NextResponse.rewrite(url);
        }

        // Markdown for Agents: serve markdown to clients that ask for it.
        if (
            request.method === "GET" &&
            acceptsMarkdown(request.headers.get("accept")) &&
            !isAdminPage && !isAdminApi && !pathname.startsWith("/api") && !pathname.includes(".")
        ) {
            const url = request.nextUrl.clone();
            url.pathname = "/api/markdown";
            url.search = `?path=${encodeURIComponent(pathname + request.nextUrl.search)}`;
            return NextResponse.rewrite(url);
        }

        const isInternalRewrite =pathname.startsWith(`/${tenantDomain}/`) || pathname === `/${tenantDomain}`;

        if (!isAdminPage && !isAdminApi && !pathname.startsWith("/api") && !pathname.includes(".") && !isInternalRewrite) {
            const url = request.nextUrl.clone();
            url.pathname = `/${tenantDomain}${pathname}`;
            return NextResponse.rewrite(url);
        }

        // 2. ADMIN AUTHENTICATION LOGIC
        if (!isAdminPage && !isAdminApi) {
            return response;
        }

        if (isAdminLogin || isAdminAuthApi) {
            return response;
        }

        // Verify JWT from httpOnly cookie — jose is Edge-compatible, no DB call needed.
        const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
        const payload = token ? await verifyAdminJwt(token) : null;
        const isAuthenticated = Boolean(payload && (payload.role === "admin" || payload.role === "moderator"));
        const isModerator = Boolean(payload && payload.role === "moderator");
        const isModeratorPage = pathname.startsWith("/admin/moderator");

        if (!isAuthenticated) {
            if (isAdminApi) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const loginUrl = new URL("/admin/login", request.url);
            loginUrl.searchParams.set("redirectTo", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Moderators can only access /admin/moderator/* routes
        if (isModerator && !isModeratorPage && !isAdminApi) {
            return NextResponse.redirect(new URL("/admin/moderator", request.url));
        }

        response.cookies.set(ADMIN_ROLE_COOKIE, "verified", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.COOKIE_SECURE === "true",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
        response.headers.set("Surrogate-Control", "no-store");

        return response;
    } catch {
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         */
        "/((?!_next/static|_next/image).*)",
    ],
};
