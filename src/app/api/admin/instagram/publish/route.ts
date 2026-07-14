import { NextRequest, NextResponse } from "next/server";
import { instagramPublishingService } from "@/services/admin/instagramPublishing.service";
import { instagramPublishRequestSchema } from "@/lib/validation/instagramPublishing";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const json = await req.json();
    const parsed = instagramPublishRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const results = await instagramPublishingService.publishToInstagram(parsed.data.articleIds, tenantId);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[admin/instagram/publish] Error:", error);
    return NextResponse.json({ error: "Failed to publish to Instagram" }, { status: 500 });
  }
}
