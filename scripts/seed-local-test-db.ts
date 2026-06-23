/**
 * One-off setup for the local Docker Postgres used by `npm run verify`'s
 * authenticated checks. NOT for the real staging database — always run
 * this with an explicit local DATABASE_URL override so it can never touch
 * the real RDS instance by accident, regardless of what .env says:
 *
 *   DATABASE_URL="postgresql://postgres:password@localhost:5432/news-media" npx tsx scripts/seed-local-test-db.ts
 *
 * Ensures all 7 tenant domains exist locally and that every admin account
 * for them has a known password (ACCOUNT_PASS from .env), so the same
 * .env credentials used against staging also work against this local DB.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

const LOCAL_URL = "postgresql://postgres:password@localhost:5432/news-media";

const TENANTS: { domain: string; slug: string; siteName: string; email: string }[] = [
  { domain: "newsicons.com", slug: "newsicons", siteName: "NewsIcons", email: "admin@newsicons.com" },
  { domain: "lavaguetech.com", slug: "lavaguetech", siteName: "LavagueTech", email: "admin@lavaguetech.com" },
  { domain: "voicejeju.com", slug: "voicejeju", siteName: "VoiceJeju", email: "admin@voicejeju.com" },
  { domain: "jejujapan.com", slug: "jejujapan", siteName: "JejuJapan", email: "admin@jejujapan.com" },
  { domain: "jejuqq.com", slug: "jejuqq", siteName: "JejuQQ", email: "admin@jejuqq.com" },
  { domain: "jejutime.com", slug: "jejutime", siteName: "JejuTime", email: "admin@jejutime.com" },
  { domain: "skyblueprime.com", slug: "skyblueprime", siteName: "Sky Blue Prime", email: "admin@skyblueprime.com" },
];

async function main() {
  if (process.env.DATABASE_URL !== LOCAL_URL) {
    console.error(
      `Refusing to run: DATABASE_URL is not the local Docker database.\n` +
        `Expected: ${LOCAL_URL}\nGot:      ${process.env.DATABASE_URL}`
    );
    process.exit(1);
  }

  const password = process.env.ACCOUNT_PASS;
  if (!password) {
    console.error("ACCOUNT_PASS is not set in .env — needed to set a known admin password.");
    process.exit(1);
  }
  const hashed = await bcrypt.hash(password, 10);

  for (const { domain, slug, siteName, email } of TENANTS) {
    const tenant = await prisma.tenant.upsert({
      where: { domain },
      update: {},
      create: { domain, slug, siteName },
    });

    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      update: { password: hashed, role: "admin" },
      create: {
        tenantId: tenant.id,
        email,
        password: hashed,
        role: "admin",
        firstName: "Admin",
        lastName: siteName,
      },
    });

    console.log(`✓ ${domain} — tenant ready, ${email} password set to ACCOUNT_PASS`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
