




































































































































import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { resolveTenantIdFromRequest } from "@/lib/tenant";
import { accountsService, AccountsServiceError } from "@/services/admin/accounts.service";

export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const users = await accountsService.getAccounts(tenantId);
    return NextResponse.json(users);
  } catch (error) {
    console.error("[GET /api/admin/accounts] Error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const newUser = await accountsService.createAccount({ firstName, lastName, email, password }, tenantId);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AccountsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[POST /api/admin/accounts] Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    await accountsService.deleteAccount(id, tenantId);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: unknown) {
    if (error instanceof AccountsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[DELETE /api/admin/accounts] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, firstName, lastName, password } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const updatedUser = await accountsService.updateAccount(id, { firstName, lastName, password }, tenantId);
    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    if (error instanceof AccountsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[PATCH /api/admin/accounts] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
