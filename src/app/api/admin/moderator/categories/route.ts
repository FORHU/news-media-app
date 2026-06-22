import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { moderatorService } from "@/services/admin/moderator.service";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") {
      return NextResponse.json([], { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId =
      searchParams.get("tenantId") || (await resolveTenantIdFromRequest(request));

    if (!tenantId) return NextResponse.json([], { status: 400 });

    const categories = await moderatorService.getCategories(tenantId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[moderator/categories] Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
