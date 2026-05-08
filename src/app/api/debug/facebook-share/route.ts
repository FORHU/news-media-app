import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      domain?: string;
      pageUrl?: string;
      facebookSharerUrl?: string;
      articleId?: string;
    };

    const domain = (body.domain ?? "").toLowerCase().trim();

    if (domain === "jejutime.com") {
      console.log(
        `[Facebook Share] domain=${domain} articleId=${body.articleId ?? ""}`,
        `pageUrl=${body.pageUrl ?? ""}`,
        `sharerUrl=${body.facebookSharerUrl ?? ""}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[Facebook Share] debug route error:", error?.message ?? error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

