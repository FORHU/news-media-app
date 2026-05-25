import { NextResponse } from "next/server";
import { ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";

export async function POST() {
    const cookieClearOpts = {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.COOKIE_SECURE === "true",
        path: "/",
        maxAge: 0,
    };

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_JWT_COOKIE, "", cookieClearOpts);
    response.cookies.set(ADMIN_ROLE_COOKIE, "", cookieClearOpts);
    response.cookies.set("admin-authenticated", "", cookieClearOpts);
    return response;
}
