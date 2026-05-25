import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SELECT_FIELDS = {
  id: true,
  title: true,
  slug: true,
  status: true,
  imageUrl: true,
  publishDate: true,
  createdAt: true,
  tenantId: true,
  tenant: { select: { domain: true } },
  category: { select: { id: true, categoryName: true } },
  user: { select: { firstName: true, lastName: true } },
};

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "moderator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.sub;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 10;
    const skip = (page - 1) * limit;

    const baseWhere = { usersId: userId, sourceType: "MANUAL" as const };
    // Paginate by the English (primary) articles only
    const primaryWhere = { ...baseWhere, tenant: { domain: "jejutime.com" } };

    const [primaryArticles, total] = await Promise.all([
      prisma.contentArticle.findMany({
        where: primaryWhere,
        select: SELECT_FIELDS,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contentArticle.count({ where: primaryWhere }),
    ]);

    // For each primary article, find its 3 sibling translations by createdAt proximity
    const TWO_MINUTES = 2 * 60 * 1000;
    const groups = await Promise.all(
      primaryArticles.map(async (primary) => {
        const base = new Date(primary.createdAt).getTime();
        const siblings = await prisma.contentArticle.findMany({
          where: {
            ...baseWhere,
            NOT: { tenant: { domain: "jejutime.com" } },
            createdAt: {
              gte: new Date(base - TWO_MINUTES),
              lte: new Date(base + TWO_MINUTES),
            },
          },
          select: SELECT_FIELDS,
          orderBy: { createdAt: "asc" },
        });
        return { primary, siblings };
      })
    );

    return NextResponse.json({
      groups,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[moderator/articles GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
