import { NextResponse } from "next/server";
import { categoriesService } from "@/services/categories.service";
import { createCategorySchema } from "@/lib/validation/category";

export async function GET() {
  try {
    const categories = await categoriesService.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = createCategorySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 }
      );
    }
    const category = await categoriesService.createCategory(parsed.data.name);
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Create category API error:", error);
    
    // Check if it's our custom validation error
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

