import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email, role: "admin", tenantId },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      console.warn(`[verify-email] Access denied for ${email}. Role: ${user?.role ?? 'not found'}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[verify-email] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
