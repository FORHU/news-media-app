import { NextResponse } from "next/server";
import { generalPublishRepository } from "@/repositories/admin/generalPublish.repository";
import { prisma } from "@/lib/db";

// Lists the sites a broadcast can target (same set createBroadcast uses when no
// explicit selection is given). Gated by proxy.ts's admin/moderator JWT check.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const targets = await generalPublishRepository.getTargetTenants();
    const rows = await prisma.tenant.findMany({
      where: { id: { in: targets.map((t) => t.id) } },
      select: { id: true, domain: true, siteName: true },
      orderBy: { domain: "asc" },
    });
    return NextResponse.json({ targets: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching general publish targets:", error);
    return NextResponse.json({ error: "Failed to fetch target sites" }, { status: 500 });
  }
}
