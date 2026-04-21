import { NextRequest, NextResponse } from "next/server";
import { bannersService } from "@/services/banners.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const banner = await bannersService.updateBanner(id, data);
    return NextResponse.json(banner);
  } catch (error: any) {
    console.error("Admin banner update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 400 }
    );
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
