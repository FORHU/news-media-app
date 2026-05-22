import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { articleIds } = await req.json();
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: "articleIds is required" }, { status: 400 });
    }

    const { count } = await prisma.contentArticle.updateMany({
      where: {
        id: { in: articleIds },
        sourceType: "MANUAL",
      },
      data: { status: "unpublished" },
    });

    console.log(
      `[moderator/unpublish] ⬇️ Unpublished ${count}/${articleIds.length} articles | moderator: ${payload.email} | ids: [${articleIds.join(", ")}]`
    );

    return NextResponse.json({ success: true, unpublished: count });
  } catch (error: any) {
    console.error("[moderator/unpublish] Error:", error);
    return NextResponse.json({ error: "Failed to unpublish articles" }, { status: 500 });
  }
}
