import { prisma } from "@/lib/db";
import { NewsletterServiceError } from "@/services/newsletter/NewsletterServiceError";

export type OtpData = {
  otpCode: string;
  expiresAt: Date;
  attempts: number;
};

const MAX_VERIFY_ATTEMPTS = 3;

export const newsletterRepository = {
  findSubscriberByEmail(email: string) {
    return prisma.subscriber.findUnique({ where: { email } });
  },

  upsertSubscriber(email: string) {
    return prisma.subscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
  },

  upsertSubscriberOtp(email: string, otpData: OtpData) {
    return prisma.subscriber.upsert({
      where: { email },
      update: otpData,
      create: { email, ...otpData },
    });
  },

  getRawSendWindow(email: string) {
    return prisma.$queryRaw<
      { attempts: number; last_otp_sent_at: Date | null }[]
    >`SELECT attempts, last_otp_sent_at FROM subscribers WHERE email = ${email} LIMIT 1`;
  },

  updateLastOtpSentAt(email: string, date: Date) {
    return prisma.$executeRaw`
      UPDATE subscribers SET last_otp_sent_at = ${date} WHERE email = ${email}
    `;
  },

  incrementAttempts(email: string) {
    return prisma.subscriber.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
  },

  markVerified(email: string) {
    return prisma.subscriber.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        expiresAt: null,
        attempts: 0,
      },
    });
  },

  resetLastOtpSentAt(email: string) {
    return prisma.$executeRaw`
      UPDATE subscribers SET last_otp_sent_at = NULL WHERE email = ${email}
    `;
  },

  async replacePreferences(subscriberId: string, categoryIds: string[]) {
    await prisma.subscriberPreference.deleteMany({
      where: { subscriberId },
    });

    if (categoryIds.length > 0) {
      await prisma.subscriberPreference.createMany({
        data: categoryIds.map((categoryId) => ({ subscriberId, categoryId })),
        skipDuplicates: true,
      });
    }
  },

  async verifyOtp(email: string, code: string, categories: string[]): Promise<void> {
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

