import { NextRequest, NextResponse } from "next/server";
import { generalPublishService } from "@/services/admin/generalPublish.service";

// Recent General Publish history, newest first. proxy.ts gates /api/admin/*.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const broadcastId = searchParams.get("broadcastId") || undefined;
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "40", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 40;

  try {
    const entries = await generalPublishService.getAuditLog({ broadcastId, limit });
    return NextResponse.json({ entries }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching general publish audit log:", error);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
}
