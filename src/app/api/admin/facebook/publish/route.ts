import { NextRequest, NextResponse } from "next/server";
import { facebookPublishingService } from "@/services/admin/facebookPublishing.service";
import { facebookPublishRequestSchema } from "@/lib/validation/facebookPublishing";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const json = await req.json();
    const parsed = facebookPublishRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
    }

    const results = await facebookPublishingService.publishToFacebook(parsed.data.articleIds, tenantId);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[admin/facebook/publish] Error:", error);
    return NextResponse.json({ error: "Failed to publish to Facebook" }, { status: 500 });
  }
}
