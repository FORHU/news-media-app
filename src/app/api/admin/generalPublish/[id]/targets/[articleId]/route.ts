import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generalPublishService } from "@/services/admin/generalPublish.service";
import { generalPublishRepository } from "@/repositories/admin/generalPublish.repository";
import { sseBroadcaster } from "@/lib/sse";
import { notifySearchEngines, articlePingUrls } from "@/lib/searchPing";
import { getAdminEmail } from "@/lib/auth";
import { detectStrayNotes, strayNotesMessage } from "@/lib/generalPublishRules";

// Publish or unpublish ONE site's copy of a broadcast (the per-site action in
// the General Publish card), leaving every other site as it is.
export const dynamic = "force-dynamic";

const bodySchema = z.object({ publish: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const { id, articleId } = await params;

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const { publish } = parsed.data;

    if (publish) {
      const broadcast = await generalPublishRepository.findBroadcast(id);
      if (!broadcast) return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
      const notes = detectStrayNotes(broadcast.content);
      if (notes.found.length > 0) {
        return NextResponse.json({ error: strayNotesMessage(notes.found) }, { status: 422 });
      }
    }

    const result = await generalPublishService.setTargetStatus(id, articleId, publish);
    if (!result) {
      return NextResponse.json({ error: "That site's copy was not found on this broadcast" }, { status: 404 });
    }
    const { outcome, broadcastTitle } = result;

    try {
      revalidatePath(`/${outcome.domain}`, "page");
      revalidatePath(`/${outcome.domain}/search`, "page");
      revalidatePath(`/${outcome.domain}/article/${outcome.contentArticleId}`, "page");
      if (outcome.slug) revalidatePath(`/${outcome.domain}/article/${outcome.slug}`, "page");
    } catch (error) {
      console.error("[Revalidate] Error:", error);
    }
    sseBroadcaster.broadcast("articles:updated");

    if (publish) {
      notifySearchEngines([
        { domain: outcome.domain, urls: articlePingUrls(outcome.domain, outcome.slug ?? outcome.contentArticleId ?? "") },
      ]);
    }

    await generalPublishService.audit(
      await getAdminEmail(req),
      { id, title: broadcastTitle },
      publish ? "site_publish" : "site_unpublish",
      { domain: outcome.domain }
    );

    return NextResponse.json({ outcome });
  } catch (error: unknown) {
    console.error("[PATCH generalPublish/targets] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
