import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generalPublishService } from "@/services/admin/generalPublish.service";
import { sseBroadcaster } from "@/lib/sse";
import { notifySearchEngines, articlePingUrls } from "@/lib/searchPing";

// Creates this broadcast's article for any active tenant added since it was
// first published — the "Update New Tenants" action on a card whose
// publishedCount/targetCount no longer match (see GeneralPublishesList.tsx).
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { outcomes, addedCount, publish } = await generalPublishService.syncNewTenants(id);

    for (const outcome of outcomes) {
      if (!outcome.success) continue;
      try {
        revalidatePath(`/${outcome.domain}`, "page");
        revalidatePath(`/${outcome.domain}/search`, "page");
        if (outcome.contentArticleId) {
          revalidatePath(`/${outcome.domain}/article/${outcome.contentArticleId}`, "page");
        }
      } catch (error) {
        console.error("[Revalidate] Error:", error);
      }
    }

    if (addedCount > 0) sseBroadcaster.broadcast("articles:updated");

    if (publish) {
      notifySearchEngines(
        outcomes.flatMap((o) =>
          o.success
            ? [{ domain: o.domain, urls: articlePingUrls(o.domain, o.slug ?? o.contentArticleId ?? "") }]
            : []
        )
      );
    }

    return NextResponse.json({ outcomes, addedCount });
  } catch (error: unknown) {
    console.error("[POST generalPublish/sync-new-tenants] Error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
