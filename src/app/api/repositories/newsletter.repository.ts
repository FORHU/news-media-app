import { prisma } from "@/lib/db";

export type OtpData = {
  otpCode: string;
  expiresAt: Date;
  attempts: number;
};

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
};
