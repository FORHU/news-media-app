import { NextRequest, NextResponse } from "next/server";
import { generalPublishService } from "@/services/admin/generalPublish.service";
import { generalPublishesQuerySchema, createManualGeneralPublishSchema } from "@/lib/validation/generalPublish";
import { sseBroadcaster } from "@/lib/sse";

// Tenant-agnostic by design — this fans out across an explicit target-tenant
// list (every active tenant except the 4 Jeju sites), not the caller's own
// tenant. /api/admin/* is already gated by proxy.ts's admin/moderator JWT
// check regardless of which tenant the caller is scoped to.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = generalPublishesQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await generalPublishService.getGeneralPublishes(parsed.data);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("Error fetching general publishes:", error);
    return NextResponse.json({ error: "Failed to fetch general publishes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createManualGeneralPublishSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const created = await generalPublishService.createManualBroadcast(parsed.data);
    sseBroadcaster.broadcast("articles:updated");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating general publish:", error);
    const message = error instanceof Error ? error.message : "Failed to create broadcast article";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
