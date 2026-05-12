import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { TENANT_DOMAIN_COOKIE, getTenantDomainFromRequest, resolveTenantIdFromDomain } from "@/lib/tenant";
import { prisma } from "@/lib/db";

const ADMIN_ROLE_COOKIE = "admin_verified";

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
                secure: process.env.NODE_ENV === "production",
                path: "/",
            });
        }

        // 1. PUBLIC ROUTE REWRITING
        // Handle logo.png specifically to provide domain-specific logos
        if (pathname === "/logo.png") {
            const url = request.nextUrl.clone();
            const logoFile = 
                tenantDomain === "jejujapan.com" ? "JEJUJAPANLOGO.png" : 
                tenantDomain === "jejuqq.com" ? "JEJUQQLOGO.png" : 
                tenantDomain === "voicejeju.com" ? "VOICEJEJULOGO.png" : 
                tenantDomain === "newsicons.com" ? "JEJUTIMELOGO.png" : // Placeholder until specific file exists
                "JEJUTIMELOGO.png"; // Default fallback
            url.pathname = `/Logo/${logoFile}`;
            return NextResponse.rewrite(url);
        }

        // If it's not an admin or API route, rewrite to the domain-specific path
        const isInternalRewrite = pathname.startsWith(`/${tenantDomain}/`) || pathname === `/${tenantDomain}`;

        if (!isAdminPage && !isAdminApi && !pathname.startsWith("/api") && !pathname.includes(".") && !isInternalRewrite) {
            const url = request.nextUrl.clone();
            url.pathname = `/${tenantDomain}${pathname}`;
            return NextResponse.rewrite(url);
        }

        // 2. ADMIN AUTHENTICATION LOGIC (Preserved)
        if (!isAdminPage && !isAdminApi) {
            return response;
        }

        if (isAdminLogin || isAdminAuthApi) {
            return response;
        }

        let supabaseResponse = response;

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => request.cookies.getAll(),
                    setAll: (cookiesToSet) => {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set({ name, value, ...options })
                        );
                        supabaseResponse = NextResponse.next({ request });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const adminRoleCookie = request.cookies.get(ADMIN_ROLE_COOKIE)?.value;
        const hasAdminRoleCookie = adminRoleCookie === "verified";
        let hasAdminRoleDb = false;

        if (user?.email && tenantDomain) {
            const tenantId = await resolveTenantIdFromDomain(tenantDomain);
            if (tenantId) {
                const dbUser = await prisma.user.findFirst({
                    where: { email: user.email, role: "admin", tenantId },
                    select: { email: true },
                });
                hasAdminRoleDb = Boolean(dbUser);
            }
        }

        const hasAdminRole = hasAdminRoleCookie || hasAdminRoleDb;
        const isAuthenticated = Boolean(user) && hasAdminRole;

        if (!isAuthenticated) {
            if (isAdminApi) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            const loginUrl = new URL("/admin/login", request.url);
            loginUrl.searchParams.set("redirectTo", pathname);
            const redirectResponse = NextResponse.redirect(loginUrl);
            request.cookies.getAll().forEach((cookie) => {
                if (cookie.name.startsWith('sb-')) {
                    redirectResponse.cookies.set(cookie.name, cookie.value);
                }
            });
            return redirectResponse;
        }

        supabaseResponse.cookies.set(ADMIN_ROLE_COOKIE, "verified", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        supabaseResponse.headers.set("Pragma", "no-cache");
        supabaseResponse.headers.set("Expires", "0");
        supabaseResponse.headers.set("Surrogate-Control", "no-store");

        return supabaseResponse;
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
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
