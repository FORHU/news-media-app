import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { categoryName: "asc" },
    });

    // Only return the fields the UI needs
    return NextResponse.json(
      categories.map((c) => ({
        id: c.id,
        name: c.categoryName,
      }))
    );
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

