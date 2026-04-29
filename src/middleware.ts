import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { TENANT_DOMAIN_COOKIE, getTenantDomainFromRequest } from "@/lib/tenant";

const ADMIN_ROLE_COOKIE = "admin-role";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAdminPage = pathname.startsWith("/admin");
    const isAdminApi = pathname.startsWith("/api/admin");
    const isAdminLogin = pathname === "/admin/login";
    const isAdminAuthApi = pathname.startsWith("/api/admin/auth/");

    // Tenant scoping (domain-based).
    // Example: host = "korea.com:3000" -> tenant_domain = "korea.com"
    const tenantDomain = getTenantDomainFromRequest(request);
    let response = NextResponse.next({ request });
    if (tenantDomain) {
        response.cookies.set(TENANT_DOMAIN_COOKIE, tenantDomain, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });
    }

    if (!isAdminPage && !isAdminApi) {
        return response;
    }

    // Auth routes are always open (login page + auth API handlers)
    if (isAdminLogin || isAdminAuthApi) {
        return response;
    }

    // Build a response that the SSR client can write refreshed tokens into
    let supabaseResponse = response;

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    // Write updated tokens back to the request so that downstream
                    // Route Handlers also see the refreshed session.
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set({ name, value, ...options })
                    );
                    // Re-initialize the response with the modified request.
                    supabaseResponse = NextResponse.next({ request });
                    // Write updated tokens back to the response for the browser.
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // getUser() validates the JWT against Supabase AND auto-refreshes if near expiry.
    // Never use getSession() here — it only reads from the cookie without server validation.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Also require the admin-role cookie that is set during the login role-check.
    const hasAdminRole =
        request.cookies.get(ADMIN_ROLE_COOKIE)?.value === "verified";

    const isAuthenticated = Boolean(user) && hasAdminRole;

    if (!isAuthenticated) {
        if (isAdminApi) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);

        // Create the redirect response
        const redirectResponse = NextResponse.redirect(loginUrl);

        // IMPORTANT: If a refresh happened but role check failed, we still want to
        // carry the refreshed Supabase cookies over to the redirect response.
        request.cookies.getAll().forEach((cookie) => {
            if (cookie.name.startsWith('sb-')) {
                redirectResponse.cookies.set(cookie.name, cookie.value);
            }
        });

        return redirectResponse;
    }

    // Extend the admin-role cookie on every successful authenticated request (rolling session).
    // This prevents the session from expiring after 24 hours if the user is active.
    supabaseResponse.cookies.set(ADMIN_ROLE_COOKIE, "verified", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
    });

    // Return supabaseResponse so that any refreshed token cookies written by
    // the SSR client (via setAll) are forwarded to the browser.
    // Also set cache control to prevent sensitive admin pages from being cached.
    supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    supabaseResponse.headers.set("Pragma", "no-cache");
    supabaseResponse.headers.set("Expires", "0");
    supabaseResponse.headers.set("Surrogate-Control", "no-store");

    return supabaseResponse;
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
    // Middleware must run in Node runtime because `@supabase/ssr` depends on Node's `crypto`.
    runtime: "nodejs",
};
