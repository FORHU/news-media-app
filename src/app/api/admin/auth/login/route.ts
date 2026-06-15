import { NextRequest, NextResponse } from "next/server";
import { ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { authService, AuthServiceError } from "@/services/admin/auth.service";

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { token, role } = await authService.login(email, password, tenantId);

    const cookieOpts = authService.cookieOptions();
    const response = NextResponse.json({ ok: true, role });
    response.cookies.set(ADMIN_JWT_COOKIE, token, cookieOpts);
    response.cookies.set(ADMIN_ROLE_COOKIE, "verified", cookieOpts);
    return response;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/admin/auth/login] Error:", error);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
