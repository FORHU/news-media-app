import { NextRequest, NextResponse } from "next/server";
import { articlesService } from "@/services/articles.service";

export async function POST(
  request: NextRequest,
  context: any
) {
  console.log("[View Tracker] API Route Hit");
  try {
    // Handle both Promise and non-Promise params for compatibility
    const params = await context.params;
    const id = params?.id;
    
    console.log(`[View Tracker] Request for article: ${id}`);
    
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await articlesService.incrementViewCount(id);
    console.log(`[View Tracker] Success: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[View Tracker] CRITICAL ERROR:", error.message || error);
    return NextResponse.json({ error: "Internal Error", details: error.message }, { status: 500 });
  }
}
