import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Temporary diagnostic endpoint — remove after confirming webhook works
export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await prisma.apiKey.count();
    checks.api_keys = "ok";
  } catch (e: unknown) {
    checks.api_keys = e instanceof Error ? e.message : String(e);
  }

  try {
    await prisma.externalArticleSubmission.count();
    checks.external_article_submissions = "ok";
  } catch (e: unknown) {
    checks.external_article_submissions = e instanceof Error ? e.message : String(e);
  }

  try {
    await prisma.contentArticle.count({
      where: { sourceType: "EXTERNAL" },
    });
    checks.source_type_external = "ok";
  } catch (e: unknown) {
    checks.source_type_external = e instanceof Error ? e.message : String(e);
  }

  try {
    await prisma.category.count();
    checks.categories = "ok";
  } catch (e: unknown) {
    checks.categories = e instanceof Error ? e.message : String(e);
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json({ allOk, checks }, { status: allOk ? 200 : 500 });
}
