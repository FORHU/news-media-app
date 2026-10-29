import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generalPublishService, summarizeOutcomes } from "@/services/admin/generalPublish.service";
import { sseBroadcaster } from "@/lib/sse";
import { notifySearchEngines, articlePingUrls } from "@/lib/searchPing";
import { getAdminEmail } from "@/lib/auth";

// Creates this broadcast's article for any active tenant added since it was
// first published — the "Update New Tenants" action on a card whose
// publishedCount/targetCount no longer match (see GeneralPublishesList.tsx).
// With a `tenantIds` body it instead retries those specific sites (the
// "Retry" action on a site the broadcast failed to reach).
export const dynamic = "force-dynamic";

const bodySchema = z.object({ tenantIds: z.array(z.string().min(1)).min(1).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // The body is optional: the plain "Update New Sites" call sends none.
    const raw = await req.json().catch(() => ({}));
    const parsedBody = bodySchema.safeParse(raw);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid retry request" }, { status: 400 });
    }
    const { tenantIds } = parsedBody.data;

    const { outcomes, addedCount, publish, title } = await generalPublishService.syncNewTenants(id, { tenantIds });

    for (const outcome of outcomes) {
      if (!outcome.success) continue;
      try {
        revalidatePath(`/${outcome.domain}`, "page");
        revalidatePath(`/${outcome.domain}/search`, "page");
        if (outcome.contentArticleId) {
          revalidatePath(`/${outcome.domain}/article/${outcome.contentArticleId}`, "page");
        }
        if (outcome.slug) {
          revalidatePath(`/${outcome.domain}/article/${outcome.slug}`, "page");
        }
      } catch (error) {
        console.error("[Revalidate] Error:", error);
      }
    }

    if (addedCount > 0) {
      sseBroadcaster.broadcast("articles:updated");
      await generalPublishService.audit(
        await getAdminEmail(req),
        { id, title },
        tenantIds ? "retry" : "sync",
        summarizeOutcomes(outcomes)
      );
    }

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
