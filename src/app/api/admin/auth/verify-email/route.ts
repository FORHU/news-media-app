import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email, role: "admin" },
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
