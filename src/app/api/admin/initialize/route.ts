import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Placeholder for DB initialization / seed if needed
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
