import { NextRequest, NextResponse } from "next/server";
import { verifyAdminJwt, ADMIN_JWT_COOKIE } from "@/lib/auth";
import { apiKeysService, ApiKeysServiceError } from "@/services/admin/apiKeys.service";

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

    const apiKey = await apiKeysService.create(sourceName, expiresAt);
    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    if (error instanceof ApiKeysServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
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

    const keys = await apiKeysService.list(payload.tenantId);
    return NextResponse.json(keys);
  } catch (error) {
    console.error("[admin/apiKeys GET]", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_JWT_COOKIE)?.value;
    const payload = token ? await verifyAdminJwt(token) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, autoPublish } = await req.json();
    if (!id || typeof autoPublish !== "boolean") {
      return NextResponse.json({ error: "id and autoPublish (boolean) are required" }, { status: 400 });
    }

    const updated = await apiKeysService.updateAutoPublish(id, autoPublish, payload.tenantId);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ApiKeysServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/apiKeys PATCH]", error);
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
  }
}
