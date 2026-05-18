import { newsletterRepository } from "@/repositories/newsletter.repository";
import { sendNewsletterOtpEmail } from "@/lib/email/newsletterOtp";
import { NewsletterServiceError } from "@/services/newsletter/NewsletterServiceError";
import { getTenantById, getSiteNameFromDomain } from "@/lib/tenant";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SENDS_PER_WINDOW = 3;

export { NewsletterServiceError };

export const newsletterService = {
  async subscribe(email: string, tenantId: string): Promise<void> {
    await newsletterRepository.upsertSubscriber(email, tenantId);
  },

  async checkEmailSubscribed(
    email: string,
    tenantId: string
  ): Promise<{ subscribed: boolean }> {
    const subscriber = await newsletterRepository.findSubscriberByEmail(email, tenantId);
    return { subscribed: subscriber?.isVerified === true };
  },

  async sendOtp(email: string, tenantId: string): Promise<void> {
    const now = new Date();
    let attempts: number;

    const rows = await newsletterRepository.getRawSendWindow(email, tenantId);
    const existing = rows[0];

    if (existing?.last_otp_sent_at != null) {
      const inSameWindow =
        now.getTime() - existing.last_otp_sent_at.getTime() < WINDOW_MS;

      if (inSameWindow) {
        if (existing.attempts >= MAX_SENDS_PER_WINDOW) {
          throw new NewsletterServiceError(
            "You have reached the maximum number of resend attempts. Please try again later.",
            429
          );
        }
        attempts = existing.attempts + 1;
      } else {
        attempts = 1;
      }
    } else {
      attempts = 1;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await newsletterRepository.upsertSubscriberOtp(email, tenantId, {
      otpCode: code,
      expiresAt,
      attempts,
    });

    // Resolve tenant info for dynamic email branding
    const tenant = await getTenantById(tenantId);
    const domain = tenant?.domain || null;
    const siteName = tenant?.siteName || getSiteNameFromDomain(domain);
    const senderDomain = domain || "newsicons.com";

    await newsletterRepository.updateLastOtpSentAt(email, tenantId, now);
    await sendNewsletterOtpEmail(email, code, siteName, senderDomain);
  },

  async verifyOtp(
    email: string,
    tenantId: string,
    code: string,
    categories: string[]
  ): Promise<void> {
    await newsletterRepository.verifyOtp(email, tenantId, code, categories);
  },
};
