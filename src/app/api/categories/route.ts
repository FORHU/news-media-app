import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { categoriesService } from "@/services/categories.service";
import { createCategorySchema } from "@/lib/validation/category";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    // Tenant scoping is handled server-side using the request domain.
    // If we cannot resolve a tenant, return an empty list.
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) return NextResponse.json([]);

    const categories = await categoriesService.getCategories(tenantId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(req);
    if (!tenantId) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const json = await req.json();
    const parsed = createCategorySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }
    const category = await categoriesService.createCategory(parsed.data.name, tenantId);
    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error("Create category API error:", error);
    
    // Check if it's our custom validation error
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

