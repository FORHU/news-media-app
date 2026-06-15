import { NextRequest, NextResponse } from "next/server";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { authService, AuthServiceError } from "@/services/admin/auth.service";

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await authService.verifyEmail(email, tenantId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      console.warn(`[verify-email] Access denied: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[verify-email] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
