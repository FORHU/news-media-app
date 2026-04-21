import { NextRequest, NextResponse } from "next/server";
import { bannersService } from "@/services/banners.service";

import { bannerUpdateSchema } from "@/lib/validation/banners";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = bannerUpdateSchema.parse(body);
    const banner = await bannersService.updateBanner(id, validatedData);
    return NextResponse.json(banner);
  } catch (error: any) {
    console.error("Admin banner update error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await bannersService.deleteBanner(id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Admin banner deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 400 }
    );
  }
}
