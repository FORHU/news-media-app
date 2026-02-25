import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { newsletterSubscribeSchema } from "@/lib/validation/newsletter";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Generate a simple 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP details on the subscriber row (create if missing)
    const otpData = {
      otpCode: code,
      expiresAt,
      attempts: 0,
    } as any;

    await prisma.subscriber.upsert({
      where: { email },
      update: otpData,
      create: {
        email,
        ...otpData,
      },
    });

    await resend.emails.send({
      from: "NewsMedia <onboarding@resend.dev>",
      to: email,
      subject: "Your verification code",
      html: `
        <p>Your verification code is:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
        <p>This code expires in 10 minutes.</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

