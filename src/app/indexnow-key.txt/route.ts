import { env } from "@/lib/env";

// IndexNow key-verification file. IndexNow fetches this to confirm we own the
// host before accepting URL submissions. Served from the same app for every
// tenant domain, so one key covers all of them. Referenced as `keyLocation`
// in the submission payload (see src/lib/searchPing.ts).
export const dynamic = "force-dynamic";

export function GET() {
  const key = env.INDEXNOW_KEY;
  if (!key) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(key, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
