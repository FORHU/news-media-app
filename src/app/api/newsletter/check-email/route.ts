import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { newsletterSubscribeSchema } from "@/lib/validation/newsletter";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const json = await request.json();
    const result = newsletterSubscribeSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email } = result.data;

    const existing = await prisma.subscriber.findUnique({
      where: { email },
      select: { isVerified: true },
    });

    if (existing?.isVerified) {
      return NextResponse.json(
        { subscribed: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { subscribed: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

