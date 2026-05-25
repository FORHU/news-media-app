import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const sourceName = typeof body.sourceName === "string" && body.sourceName.trim()
      ? body.sourceName.trim()
      : null;
    if (!sourceName) {
      return NextResponse.json({ error: "sourceName is required" }, { status: 400 });
    }
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const tenant = await prisma.tenant.findFirst({
      where: { domain: "voicejeju.com" },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Target tenant not found" }, { status: 500 });
    }
    const tenantId = tenant.id;

    // Ensure a system bot user exists for this tenant so external articles have a valid usersId
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: `external-bot@${tenantId}.internal` } },
      update: {},
      create: {
        tenantId,
        email: `external-bot@${tenantId}.internal`,
        firstName: "External",
        lastName: "Bot",
        role: "external_bot",
        password: randomBytes(16).toString("hex"),
      },
    });

    const rawKey = randomBytes(32).toString("hex");
    const hashedKey = createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await prisma.apiKey.create({
      data: {
        key: hashedKey,
        tenantId,
        sourceName,
        expiresAt,
      },
      select: { id: true, sourceName: true, tenantId: true, isActive: true, expiresAt: true, createdAt: true },
    });

    return NextResponse.json({ ...apiKey, rawKey }, { status: 201 });
  } catch (error) {
    console.error("[admin/apiKeys POST]", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { tenantId: payload.tenantId },
      select: { id: true, sourceName: true, isActive: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(keys);
  } catch (error) {
    console.error("[admin/apiKeys GET]", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}
