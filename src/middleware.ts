import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_ROLE_COOKIE = "admin-role";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAdminPage = pathname.startsWith("/admin");
    const isAdminApi = pathname.startsWith("/api/admin");
    const isAdminLogin = pathname === "/admin/login";
    const isAdminAuthApi = pathname.startsWith("/api/admin/auth/");

    if (!isAdminPage && !isAdminApi) {
        return NextResponse.next();
    }

    // Auth routes are always open (login page + auth API handlers)
    if (isAdminLogin || isAdminAuthApi) {
        return NextResponse.next();
    }

    // Build a response that the SSR client can write refreshed tokens into
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    // Write updated tokens back to both the request and the response
                    // so that downstream Route Handlers also see the refreshed session.
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
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
        return NextResponse.redirect(loginUrl);
    }

    // Return supabaseResponse (not a plain NextResponse.next()) so that any
    // refreshed token cookies written by the SSR client are forwarded to the browser.
    // Also set cache control to prevent sensitive admin pages from being cached.
    supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    supabaseResponse.headers.set("Pragma", "no-cache");
    supabaseResponse.headers.set("Expires", "0");
    supabaseResponse.headers.set("Surrogate-Control", "no-store");

    return supabaseResponse;
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
