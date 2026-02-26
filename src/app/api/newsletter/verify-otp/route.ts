import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      code?: string;
      categories?: number[];
    };

    const email = body.email?.trim();
    const code = body.code?.trim();
    const categories = Array.isArray(body.categories)
      ? body.categories
      : [];

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (!subscriber || !subscriber.otpCode || !subscriber.expiresAt) {
      return NextResponse.json(
        { error: "No active code. Please request a new one." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (subscriber.expiresAt < now) {
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (subscriber.otpCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    await prisma.subscriber.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        expiresAt: null,
        attempts: 0,
      },
    });

    await prisma.$executeRaw`
      UPDATE subscribers SET last_otp_sent_at = NULL WHERE email = ${email}
    `;

    const uniqueCategoryIds = [
      ...new Set(
        categories.filter((id): id is number => typeof id === "number")
      ),
    ];

    if (uniqueCategoryIds.length > 0) {
      await prisma.subscriberPreference.deleteMany({
        where: { subscriberId: subscriber.id },
      });

      await prisma.subscriberPreference.createMany({
        data: uniqueCategoryIds.map((categoryId) => ({
          subscriberId: subscriber.id,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

