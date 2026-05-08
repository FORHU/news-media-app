import { NextRequest, NextResponse } from "next/server";
import { articlesService } from "@/services/articles.service";
import { getTenantDomainFromRequest } from "@/lib/tenant";

export async function POST(
  request: NextRequest,
  context: any
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
  } catch (error: any) {
    console.error("[View Tracker] CRITICAL ERROR:", error.message || error);
    return NextResponse.json({ error: "Internal Error", details: error.message }, { status: 500 });
  }
}
