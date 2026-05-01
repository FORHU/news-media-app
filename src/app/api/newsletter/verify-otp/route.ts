import { NextRequest, NextResponse } from "next/server";
import { newsletterVerifyOtpSchema } from "@/lib/validation/newsletter";
import {
  newsletterService,
  NewsletterServiceError,
} from "@/services/newsletter.service";
import { ZodError } from "zod";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const json = await request.json();
    const { email, code, categories } = newsletterVerifyOtpSchema.parse(json);

    await newsletterService.verifyOtp(email, tenantId, code, categories);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (error instanceof NewsletterServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
