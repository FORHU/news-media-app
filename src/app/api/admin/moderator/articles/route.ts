import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 10;
    const skip = (page - 1) * limit;

    const base = { tenantId, sourceType: "MANUAL" as const, user: { role: "moderator" } };
    const where = { ...base, ...(status ? { status } : {}) };

    const [articles, total, pendingCount, publishedCount] = await Promise.all([
      prisma.contentArticle.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          imageUrl: true,
          publishDate: true,
          createdAt: true,
          category: { select: { id: true, categoryName: true } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contentArticle.count({ where }),
      prisma.contentArticle.count({ where: { ...base, status: "pending" } }),
      prisma.contentArticle.count({ where: { ...base, status: "published" } }),
    ]);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      counts: { pending: pendingCount, published: publishedCount },
    });
  } catch (error) {
    console.error("[moderator/articles GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
