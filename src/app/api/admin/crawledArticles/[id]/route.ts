import { NextRequest, NextResponse } from "next/server";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { crawledArticlesService } from "@/services/admin/crawledArticles.service";
import { sseBroadcaster } from "@/lib/sse";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;
    await crawledArticlesService.deleteRawArticle(id, tenantId);
    sseBroadcaster.broadcast("rawArticles:updated");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting crawled article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
