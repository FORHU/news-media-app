import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { moderatorService, ModeratorServiceError } from "@/services/admin/moderator.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const article = await moderatorService.getArticle(id, payload.sub);
    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof ModeratorServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[moderator/articles GET single] Error:", error);
    return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await moderatorService.updateArticle(id, payload.sub, body);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ModeratorServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[moderator/articles PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await moderatorService.deleteArticle(id, payload.sub);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ModeratorServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[moderator/articles DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
