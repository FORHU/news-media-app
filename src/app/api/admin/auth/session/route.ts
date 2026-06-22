import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";
import { authService, AuthServiceError } from "@/services/admin/auth.service";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;

    if (!payload || !["admin", "moderator"].includes(payload.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await authService.getSession(payload.sub);
    return NextResponse.json({ ok: true, ...session });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to retrieve session." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;

    if (!payload || !["admin", "moderator"].includes(payload.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_ROLE_COOKIE, "verified", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to validate session." }, { status: 500 });
  }
}
