import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

const MODERATOR_ALLOWED_DOMAINS = ["voicejeju.com", "jejuqq.com", "jejujapan.com", "jejutime.com"];

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

    const currentTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { domain: true },
    });

    const currentDomain = currentTenant?.domain ?? "";

    // Look up admin scoped to current tenant only
    const adminUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, role: "admin", tenantId },
      select: { role: true },
    });

    if (adminUser) {
      return NextResponse.json({ ok: true });
    }

    // Look up moderator across ALL tenants — account may be registered under any tenant
    const moderatorUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, role: "moderator" },
      select: { role: true },
    });

    if (!moderatorUser) {
      console.warn(`[verify-email] Access denied for ${email} on ${currentDomain}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Moderators can only log in from the 4 allowed domains
    if (!MODERATOR_ALLOWED_DOMAINS.includes(currentDomain)) {
      console.warn(`[verify-email] Moderator login denied on domain: ${currentDomain}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[verify-email] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
