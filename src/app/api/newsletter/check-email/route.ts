import { NextRequest, NextResponse } from "next/server";
import { newsletterSubscribeSchema } from "@/lib/validation/newsletter";
import { newsletterService } from "@/services/newsletter.service";
import { ZodError } from "zod";
import { resolveTenantIdFromRequest } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 400 });
    }

    const json = await request.json();
    const { email } = newsletterSubscribeSchema.parse(json);

    const result = await newsletterService.checkEmailSubscribed(email, tenantId);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstIssue = error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message, issues: fieldErrors },
        { status: 400 }
      );
    }

    console.error("Check email error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
