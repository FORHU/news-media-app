import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../src/lib/db";

function randomPassword(length = 16): string {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}


async function main() {
  console.log("Seeding all tables...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "seed-tenant" },
    update: {
      domain: "seed.localhost",
      siteName: "Seed News",
      defaultLanguage: "en",
      logoUrl: "https://placehold.co/200x80/png",
      faviconUrl: "https://placehold.co/32x32/png",
      isActive: true,
    },
    create: {
      slug: "seed-tenant",
      domain: "seed.localhost",
      siteName: "Seed News",
      defaultLanguage: "en",
      logoUrl: "https://placehold.co/200x80/png",
      faviconUrl: "https://placehold.co/32x32/png",
      isActive: true,
    },
  });

  const adminEmail = "admin@seed.local";
  const rawPassword = randomPassword(14);
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const existingAdmin = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: adminEmail } },
  });
  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        firstName: "Seed",
        lastName: "Admin",
        role: "admin",
        password: hashedPassword,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        firstName: "Seed",
        lastName: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      },
    });
  }

  const category = await prisma.category.upsert({
    where: { tenantId_categoryName: { tenantId: tenant.id, categoryName: "General" } },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryName: "General",
    },
  });

  const subscriber = await prisma.subscriber.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: "subscriber@seed.local" },
    },
    update: {
      isVerified: true,
      attempts: 0,
      otpCode: null,
      expiresAt: null,
      lastOtpSentAt: null,
    },
    create: {
      tenantId: tenant.id,
      email: "subscriber@seed.local",
      isVerified: true,
      attempts: 0,
    },
  });

  await prisma.subscriberPreference.upsert({
    where: {
      subscriber_category_unique: {
        subscriberId: subscriber.id,
        categoryId: category.id,
      },
    },
    update: {},
    create: {
      subscriberId: subscriber.id,
      categoryId: category.id,
    },
  });

  console.log("\nBasic setup completed.");
  console.log(`Tenant ID: ${tenant.id}`);
  console.log(`Admin email: ${adminEmail}`);
  console.log(`Admin password: ${rawPassword}`);
  console.log("Seed completed in public schema.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
