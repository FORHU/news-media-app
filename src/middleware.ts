import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin-authenticated";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminLogin = pathname === "/admin/login";
  const isAdminAuthApi = pathname.startsWith("/api/admin/auth/");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (isAdminLogin || isAdminAuthApi) {
    return NextResponse.next();
  }

  const hasAdminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value === "true";

  if (hasAdminCookie) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirectTo", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
