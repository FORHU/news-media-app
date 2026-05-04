import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

const ADMIN_ROLE_COOKIE = "admin_verified";

/**
 * POST /api/admin/auth/session
 *
 * Called immediately after a successful supabase.auth.signInWithPassword()
 * on the login page. The Supabase SSR browser client has already stored
 * the session tokens in cookies, so this route reads the current user
 * directly from those cookies — no accessToken in the body is needed.
 *
 * Responsibilities:
 * 1. Verify there is a valid Supabase session in the cookies.
 * 2. Confirm the user has the "admin" role in our database.
 * 3. Set the admin-role=verified httpOnly cookie so the middleware
 *    can gate admin routes without a DB call on every request.
 */
export async function POST(_request: NextRequest) {
    try {
        const tenantId = await resolveTenantIdFromRequest(_request);
        if (!tenantId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await _request.json().catch(() => ({}));
        const accessToken = body.accessToken;

        // Read the current user from the Supabase session cookies or provided token
        const supabase = await createSupabaseServerClient();
        
        let user;
        let authError;

        if (accessToken) {
            const { data, error } = await supabase.auth.getUser(accessToken);
            user = data.user;
            authError = error;
        } else {
            const { data, error } = await supabase.auth.getUser();
            user = data.user;
            authError = error;
        }

        if (authError || !user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role in database
        const dbUser = await prisma.user.findFirst({
            where: { email: user.email, role: "admin", tenantId },
            select: { role: true },
        });

        if (!dbUser) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Set the admin-role cookie so the middleware can gate routes without
        // a DB call on every request. httpOnly prevents XSS access.
        const response = NextResponse.json({ ok: true });
        response.cookies.set(ADMIN_ROLE_COOKIE, "verified", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24, // 24 hours
        });
        return response;
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to validate admin session." },
            { status: 500 }
        );
    }
}
