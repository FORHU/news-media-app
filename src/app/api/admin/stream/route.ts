import { sseBroadcaster } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  // Shared cleanup refs accessible by both start() and cancel()
  let heartbeat: ReturnType<typeof setInterval>;
  let remove: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const client = {
        send(event: string, data: unknown) {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            // controller already closed — cancel() will clean up
          }
        },
      };

      remove = sseBroadcaster.addClient(client);

      // Heartbeat every 15s to prevent proxy/load-balancer timeouts
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          remove?.();
          remove = null;
        }
      }, 15_000);
    },

    // cancel() is the correct Web Streams API hook — runs when the browser disconnects
    cancel() {
      clearInterval(heartbeat);
      remove?.();
      remove = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
