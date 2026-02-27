import { NextResponse } from "next/server";
import { categoriesService } from "@/app/api/services/categories.service";

export async function GET() {
  try {
    const categories = await categoriesService.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
