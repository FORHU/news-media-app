import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signAdminJwt, ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import bcrypt from "bcryptjs";

const MODERATOR_ALLOWED_DOMAINS = ["voicejeju.com", "jejuqq.com", "jejujapan.com", "jejutime.com"];

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

    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { domain: true },
    });

    const currentDomain = currentTenant?.domain ?? "";

    // Try admin lookup scoped to current tenant first
    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, role: "admin", tenantId },
      select: { id: true, email: true, password: true, role: true, tenantId: true },
    });

    // If not found as admin, try moderator across ALL tenants
    if (!user) {
      if (!MODERATOR_ALLOWED_DOMAINS.includes(currentDomain)) {
        return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
      }
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, role: "moderator" },
        select: { id: true, email: true, password: true, role: true, tenantId: true },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
    }

    // Moderators: use current domain's tenantId so categories/articles scope to the right site
    const jwtTenantId = user.role === "moderator" ? tenantId : user.tenantId;

    const token = await signAdminJwt({
      sub: user.id,
      email: user.email,
      tenantId: jwtTenantId,
      role: user.role,
    });

    const cookieOpts = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: 60 * 60 * 24,
    };

    const response = NextResponse.json({ ok: true, role: user.role });
    response.cookies.set(ADMIN_JWT_COOKIE, token, cookieOpts);
    response.cookies.set(ADMIN_ROLE_COOKIE, "verified", cookieOpts);
    return response;
  } catch (error) {
    console.error("[POST /api/admin/auth/login] Error:", error);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
