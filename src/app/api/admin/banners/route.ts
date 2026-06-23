import { NextRequest, NextResponse } from "next/server";
import { bannersService } from "@/services/banners.service";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import type { Prisma } from "@/generated/prisma/client";

import { bannerSchema } from "@/lib/validation/banners";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    const banners = await bannersService.getBanners({ tenantId });
    return NextResponse.json(banners);
  } catch (error: unknown) {
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

    const body: unknown = await req.json();
    const validatedData = bannerSchema.parse(body);
    const banner = await bannersService.createBanner({
      ...validatedData,
      tenantId,
    } satisfies Prisma.BannerUncheckedCreateInput);
    return NextResponse.json(banner, { status: 201 });
  } catch (error: unknown) {
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
