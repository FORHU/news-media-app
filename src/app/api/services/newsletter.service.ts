import { newsletterRepository } from "@/app/api/repositories/newsletter.repository";
import { prisma } from "@/lib/db";
import { sendNewsletterOtpEmail } from "@/lib/email/newsletterOtp";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SENDS_PER_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS = 3;

export class NewsletterServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "NewsletterServiceError";
  }
}

export const newsletterService = {
  async subscribe(email: string): Promise<void> {
    await newsletterRepository.upsertSubscriber(email);
  },

  async checkEmailSubscribed(email: string): Promise<{ subscribed: boolean }> {
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
    categories: number[]
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const subscriber = await tx.subscriber.findUnique({
        where: { email },
      });

      if (!subscriber || !subscriber.otpCode || !subscriber.expiresAt) {
        throw new NewsletterServiceError(
          "No active code. Please request a new one.",
          400
        );
      }

      if (subscriber.expiresAt < new Date()) {
        throw new NewsletterServiceError(
          "Code has expired. Please request a new one.",
          400
        );
      }

      if (subscriber.attempts >= MAX_VERIFY_ATTEMPTS) {
        throw new NewsletterServiceError(
          "Too many attempts. Please request a new code.",
          429
        );
      }

      if (subscriber.otpCode !== code) {
        await tx.subscriber.update({
          where: { email },
          data: { attempts: { increment: 1 } },
        });
        const remaining = MAX_VERIFY_ATTEMPTS - (subscriber.attempts + 1);
        throw new NewsletterServiceError(
          remaining > 0
            ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many attempts. Please request a new code.",
          400
        );
      }

      await tx.subscriber.update({
        where: { email },
        data: {
          isVerified: true,
          otpCode: null,
          expiresAt: null,
          attempts: 0,
        },
      });

      await tx.$executeRaw`
        UPDATE subscribers SET last_otp_sent_at = NULL WHERE email = ${email}
      `;

      const uniqueCategoryIds = [...new Set(categories)];

      await tx.subscriberPreference.deleteMany({
        where: { subscriberId: subscriber.id },
      });

      if (uniqueCategoryIds.length > 0) {
        await tx.subscriberPreference.createMany({
          data: uniqueCategoryIds.map((categoryId) => ({
            subscriberId: subscriber.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
      }
    });
  },
};
