import { NextRequest, NextResponse } from "next/server";
import { bannersService } from "@/services/banners.service";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get("position");

    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) return NextResponse.json([]);

    const banners = await bannersService.getBanners({
      position,
      isActive: true, // Public only sees active banners
      tenantId,
    });

    return NextResponse.json(banners);
  } catch (error: unknown) {
    console.error("Public banners fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
