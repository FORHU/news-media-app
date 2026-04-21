import { NextRequest, NextResponse } from "next/server";
import { bannersService } from "@/services/banners.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get("position");

    const banners = await bannersService.getBanners({
      position,
      isActive: true, // Public only sees active banners
    });

    return NextResponse.json(banners);
  } catch (error: any) {
    console.error("Public banners fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
