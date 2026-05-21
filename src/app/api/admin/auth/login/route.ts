import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signAdminJwt, ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import bcrypt from "bcryptjs";

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

    const user = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        role: "admin",
        tenantId,
      },
      select: { id: true, email: true, password: true, role: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
    }

    const token = await signAdminJwt({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    const cookieOpts = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    };

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_JWT_COOKIE, token, cookieOpts);
    response.cookies.set(ADMIN_ROLE_COOKIE, "verified", cookieOpts);
    return response;
  } catch (error) {
    console.error("[POST /api/admin/auth/login] Error:", error);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
