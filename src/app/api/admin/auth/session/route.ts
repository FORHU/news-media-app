import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    console.log("[POST /api/admin/auth/session] Request received", {
      hasAccessToken: typeof accessToken === "string" && accessToken.length > 0,
      tokenLength: typeof accessToken === "string" ? accessToken.length : 0,
    });

    if (typeof accessToken !== "string" || accessToken.length === 0) {
      return NextResponse.json({ error: "Missing access token." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[POST /api/admin/auth/session] Missing env", {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(supabaseServiceRoleKey),
      });
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user?.email) {
      console.error("[POST /api/admin/auth/session] Supabase getUser failed", {
        authErrorMessage: authError?.message ?? null,
        authErrorStatus: authError?.status ?? null,
        hasUser: Boolean(authData.user),
        email: authData.user?.email ?? null,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authData.user.email },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "admin") {
      console.warn("[POST /api/admin/auth/session] Role check failed", {
        email: authData.user.email,
        dbRole: dbUser?.role ?? null,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("admin-authenticated", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("[POST /api/admin/auth/session] Error:", error);
    return NextResponse.json({ error: "Failed to validate admin session." }, { status: 500 });
  }
}
