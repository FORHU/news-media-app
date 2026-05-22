import { createHmac } from "crypto";

export type WebhookCallbackPayload = {
  externalArticleId: string;
  status: "approved" | "rejected";
  articleUrl?: string;
  reason?: string;
};

export async function sendWebhookCallback(
  callbackUrl: string,
  payload: WebhookCallbackPayload
): Promise<{ success: boolean; error?: string }> {
  const body = JSON.stringify(payload);
  const secret = process.env.EXTERNAL_API_WEBHOOK_SECRET ?? "";
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  try {
    const res = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature": `sha256=${signature}`,
        "User-Agent": "newsicons-cms-webhook/1.0",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(`[webhook] Callback to ${callbackUrl} returned ${res.status}`);
      return { success: false, error: `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error(`[webhook] Callback to ${callbackUrl} failed:`, message);
    return { success: false, error: message };
  }
}
