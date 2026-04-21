import { NextRequest, NextResponse } from "next/server";
import { bannersService } from "@/services/banners.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const banners = await bannersService.getBanners({});
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
    const data = await req.json();
    const banner = await bannersService.createBanner(data);
    return NextResponse.json(banner, { status: 201 });
  } catch (error: any) {
    console.error("Admin banner creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 400 }
    );
  }
}
