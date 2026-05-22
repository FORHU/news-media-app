import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";
import { TENANT_DOMAIN_COOKIE, getTenantDomainFromRequest, getSiteLogoFromDomain, getSiteIconFromDomain } from "@/lib/tenant";

export async function proxy(request: NextRequest) {
    try {
        const { pathname } = request.nextUrl;
        const isAdminPage = pathname.startsWith("/admin");
        const isAdminApi = pathname.startsWith("/api/admin");
        const isAdminLogin = pathname === "/admin/login";
        const isAdminAuthApi = pathname.startsWith("/api/admin/auth/");

        // Tenant scoping (domain-based).
        const tenantDomain = getTenantDomainFromRequest(request);

        // Create initial response
        let response = NextResponse.next({ request });

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

        const isInternalRewrite = pathname.startsWith(`/${tenantDomain}/`) || pathname === `/${tenantDomain}`;

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
    } catch (error) {
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
