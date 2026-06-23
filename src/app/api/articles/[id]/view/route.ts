import { NextRequest, NextResponse } from "next/server";
import { articlesService } from "@/services/articles.service";
import { getTenantDomainFromRequest } from "@/lib/tenant";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log("[View Tracker] API Route Hit");
  try {
    // Handle both Promise and non-Promise params for compatibility
    const params = await context.params;
    const id = params?.id;

    const tenantDomain = getTenantDomainFromRequest(request);
    const requestHost =
      request.headers.get("host") ??
      request.headers.get("x-forwarded-host") ??
      "";
    const referer = request.headers.get("referer") ?? "";
    
    console.log(
      `[View Tracker] tenant=${tenantDomain} host=${requestHost} referer=${referer} article=${id}`
    );

    if (tenantDomain === "jejutime.com") {
      console.log(
        `[JEJUTIME VISIT] article=${id} (${id ? "view increment requested" : "missing id"})`
      );
    }
    
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await articlesService.incrementViewCount(id);
    console.log(`[View Tracker] Success: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[View Tracker] CRITICAL ERROR:", message);
    return NextResponse.json({ error: "Internal Error", details: message }, { status: 500 });
  }
}
