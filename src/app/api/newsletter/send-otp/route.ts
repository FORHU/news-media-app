import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { newsletterSubscribeSchema } from "@/lib/validation/newsletter";

const resend = new Resend(process.env.RESEND_API_KEY);
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SENDS_PER_WINDOW = 3;

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

    const now = new Date();
    let attempts: number;

    const rows = await prisma.$queryRaw<
      { attempts: number; last_otp_sent_at: Date | null }[]
    >`SELECT attempts, last_otp_sent_at FROM subscribers WHERE email = ${email} LIMIT 1`;
    const existing = rows[0];

    if (existing?.last_otp_sent_at != null) {
      const lastSendAt = existing.last_otp_sent_at;
      const inSameWindow =
        now.getTime() - lastSendAt.getTime() < WINDOW_MS;

      if (inSameWindow) {
        if (existing.attempts >= MAX_SENDS_PER_WINDOW) {
          return NextResponse.json(
            {
              error:
                "You have reached the maximum number of resend attempts. Please try again later.",
            },
            { status: 429 }
          );
        }
        attempts = existing.attempts + 1;
      } else {
        attempts = 1;
      }
    } else {
      attempts = 1;
    }

    // Generate a simple 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP details on the subscriber row (create if missing).
    // Use only fields the generated Prisma client knows; set last_otp_sent_at via raw SQL.
    const otpData = {
      otpCode: code,
      expiresAt,
      attempts,
    };

    await prisma.subscriber.upsert({
      where: { email },
      update: otpData,
      create: {
        email,
        ...otpData,
      },
    });

    await prisma.$executeRaw`
      UPDATE subscribers SET last_otp_sent_at = ${now} WHERE email = ${email}
    `;

    await resend.emails.send({
      from: "NewsIcons <onboarding@resend.dev>",
      to: email,
      subject: "Your NewsIcons Verification Code",
      html: `
      <div style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              
              <!-- Card -->
              <table width="100%" cellpadding="0" cellspacing="0" 
                style="max-width:480px;background:#ffffff;border-radius:12px;
                       box-shadow:0 8px 24px rgba(0,0,0,0.08);padding:40px;">
                
                <!-- Logo / Title -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <h1 style="margin:0;font-size:22px;color:#ff4500;">
                      NewsIcons
                    </h1>
                  </td>
                </tr>
    
                <!-- Heading -->
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <h2 style="margin:0;font-size:18px;color:#222;">
                      Email Verification
                    </h2>
                  </td>
                </tr>
    
                <!-- Description -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
                      Use the verification code below to complete your subscription.
                    </p>
                  </td>
                </tr>
    
                <!-- Code Box -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="
                      display:inline-block;
                      background:#fff5f0;
                      color:#ff4500;
                      font-size:28px;
                      font-weight:700;
                      letter-spacing:8px;
                      padding:16px 24px;
                      border-radius:8px;
                      border:2px dashed #ff4500;">
                      ${code}
                    </div>
                  </td>
                </tr>
    
                <!-- Expiry -->
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <p style="margin:0;color:#888;font-size:13px;">
                      This code expires in 10 minutes.
                    </p>
                  </td>
                </tr>
    
                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #eee;padding-top:16px;">
                    <p style="margin:0;color:#999;font-size:12px;text-align:center;">
                      If you didn’t request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
    
              </table>
              <!-- End Card -->
    
            </td>
          </tr>
        </table>
      </div>
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

