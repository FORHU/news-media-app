import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "pending";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 6;
    const skip = (page - 1) * limit;

    const where = {
      sourceType: "EXTERNAL" as const,
      ...(status !== "all" ? { status } : {}),
    };

    const [articles, total] = await Promise.all([
      prisma.contentArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          imageUrl: true,
          content: true,
          createdAt: true,
          publishDate: true,
          tenant: { select: { domain: true, siteName: true } },
          category: { select: { id: true, categoryName: true } },
          externalSubmission: {
            select: {
              id: true,
              sourcePlatform: true,
              externalArticleId: true,
              callbackUrl: true,
              callbackStatus: true,
              callbackSentAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contentArticle.count({ where }),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[admin/external/articles GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch external articles" },
      { status: 500 },
    );
  }
}
