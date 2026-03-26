import { newsletterRepository } from "@/repositories/newsletter.repository";
import { sendNewsletterOtpEmail } from "@/lib/email/newsletterOtp";
import { NewsletterServiceError } from "@/services/newsletter/NewsletterServiceError";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SENDS_PER_WINDOW = 3;

export { NewsletterServiceError };

export const newsletterService = {
  async subscribe(email: string): Promise<void> {
    await newsletterRepository.upsertSubscriber(email);
  },

  async checkEmailSubscribed(
    email: string
  ): Promise<{ subscribed: boolean }> {
    const subscriber = await newsletterRepository.findSubscriberByEmail(email);
    return { subscribed: subscriber?.isVerified === true };
  },

  async sendOtp(email: string): Promise<void> {
    const now = new Date();
    let attempts: number;

    const rows = await newsletterRepository.getRawSendWindow(email);
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

    await newsletterRepository.upsertSubscriberOtp(email, {
      otpCode: code,
      expiresAt,
      attempts,
    });

    await newsletterRepository.updateLastOtpSentAt(email, now);
    await sendNewsletterOtpEmail(email, code);
  },

  async verifyOtp(
    email: string,
    code: string,
    categories: string[]
  ): Promise<void> {
    await newsletterRepository.verifyOtp(email, code, categories);
  },
};

