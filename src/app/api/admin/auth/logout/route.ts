import { NextResponse } from "next/server";

const ADMIN_ROLE_COOKIE = "admin-role";

/**
 * POST /api/admin/auth/logout
 *
 * Clears the admin-role cookie. The Supabase session cookies (sb-*) are
 * cleared on the client side by supabase.auth.signOut() in AdminSidebar,
 * which uses the SSR browser client and handles its own cookie cleanup.
 */
export async function POST() {
    const response = NextResponse.json({ ok: true });

    // Clear the admin role gate cookie
    response.cookies.set(ADMIN_ROLE_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });

    // Also clear the legacy admin-authenticated cookie in case it still exists
    // from sessions created before this migration.
    response.cookies.set("admin-authenticated", "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });

    return response;
}
