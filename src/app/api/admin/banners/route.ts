import { NextRequest, NextResponse } from "next/server";
import { bannersService } from "@/services/banners.service";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

import { bannerSchema } from "@/lib/validation/banners";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    const banners = await bannersService.getBanners({ tenantId });
    return NextResponse.json(banners);
  } catch (error: any) {
    console.error("Admin banners fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = bannerSchema.parse(body);
    const banner = await bannersService.createBanner({ 
      ...validatedData, 
      tenantId 
    } as any); // Use 'as any' if there's a slight type mismatch with the schema
    return NextResponse.json(banner, { status: 201 });
  } catch (error: any) {
    console.error("Admin banner creation error:", error);
    if (error instanceof Error) {
       return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
