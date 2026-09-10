import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { generalPublishService } from "@/services/admin/generalPublish.service";
import { generalPublishRepository } from "@/repositories/admin/generalPublish.repository";
import { updateGeneralPublishSchema } from "@/lib/validation/generalPublish";
import { sseBroadcaster } from "@/lib/sse";
import { deleteObjects } from "@/lib/s3";
import { notifySearchEngines, articlePingUrls } from "@/lib/searchPing";
import type { BroadcastOutcome } from "@/repositories/admin/generalPublish.repository";

export const dynamic = "force-dynamic";

function revalidateForOutcomes(outcomes: BroadcastOutcome[]) {
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
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await generalPublishRepository.findBroadcast(id);
    if (!existing) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    const json = await req.json();
    const result = updateGeneralPublishSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }

    const outcomes = await generalPublishService.updateBroadcast(id, result.data);

    revalidateForOutcomes(outcomes);
    sseBroadcaster.broadcast("articles:updated");

    // Nudge external indexers when this edit published the broadcast.
    if (result.data.publish) {
      notifySearchEngines(
        outcomes.flatMap((o) =>
          o.success
            ? [{ domain: o.domain, urls: articlePingUrls(o.domain, o.slug ?? o.contentArticleId ?? "") }]
            : []
        )
      );
    }

    return NextResponse.json({ outcomes });
  } catch (error: unknown) {
    console.error("[PATCH generalPublish] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await generalPublishRepository.findBroadcast(id);
    if (!existing) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }

    const domains = existing.articles.map((a) => a.tenant.domain);
    const { imageUrls } = await generalPublishService.deleteBroadcast(id);

    await deleteObjects(imageUrls);

    for (const domain of domains) {
      try {
        revalidatePath(`/${domain}`, "page");
        revalidatePath(`/${domain}/search`, "page");
      } catch (error) {
        console.error("[Revalidate] Error:", error);
      }
    }

    sseBroadcaster.broadcast("articles:updated");
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[DELETE generalPublish] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
