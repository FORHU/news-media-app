import { NextRequest, NextResponse } from "next/server";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { dashboardService } from "@/services/admin/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const stats = await dashboardService.getStats(tenantId);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats." }, { status: 500 });
  }
}
