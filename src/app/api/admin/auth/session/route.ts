import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";

/**
 * GET /api/admin/auth/session
 * Returns the current user's email and name from the JWT cookie.
 * Used by AdminSidebar and AccountsPage to identify the logged-in admin.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to retrieve session." }, { status: 500 });
  }
}

/**
 * POST /api/admin/auth/session
 * Verifies the JWT cookie and refreshes the admin_verified cookie.
 * Kept for backward compatibility with any existing callers.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_ROLE_COOKIE, "verified", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Failed to validate session." }, { status: 500 });
  }
}
