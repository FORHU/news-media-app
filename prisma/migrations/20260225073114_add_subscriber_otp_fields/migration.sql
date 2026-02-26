-- AlterTable
ALTER TABLE "subscribers" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "otp_code" TEXT;
