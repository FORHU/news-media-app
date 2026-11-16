import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { seedTenantCategories } from "./categories";

const tenant = {
  slug: "golfcarrier",
  domain: "golfcarrier.com",
  siteName: "GolfCarrier",
  defaultLanguage: "en",
};

/**
 * Seeds the golfcarrier.com tenant, its golf categories (from
 * TENANT_CATEGORIES in src/config/categories.ts) and its admin user.
 * Idempotent: safe to re-run.
 *
 * The admin password ("admin123", as on the other tenants) is only written when
 * the admin user is first created: re-running the seed never resets a password
 * that has since been changed. Change it right after the first production seed.
 */
export async function seedGolfCarrierTenant(prisma: PrismaClient) {
  console.log(`Seeding tenant: ${tenant.domain}`);

  const createdTenant = await prisma.tenant.upsert({
    where: { slug: tenant.slug },
    update: {
      domain: tenant.domain,
      siteName: tenant.siteName,
      defaultLanguage: tenant.defaultLanguage,
      isActive: true,
    },
    create: {
      slug: tenant.slug,
      domain: tenant.domain,
      siteName: tenant.siteName,
      defaultLanguage: tenant.defaultLanguage,
      isActive: true,
    },
  });

  const categories = await seedTenantCategories(prisma, tenant.domain, createdTenant.id);
  console.log(`Categories: ${Object.keys(categories).join(", ")}`);

  const adminEmail = `admin@${tenant.domain}`;
  const existingAdmin = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: createdTenant.id, email: adminEmail } },
  });

  if (existingAdmin) {
    console.log(`Tenant "${tenant.siteName}" (${createdTenant.id}) updated; admin ${adminEmail} already exists, password untouched.`);
    return;
  }

  const password = "admin123";
  await prisma.user.create({
    data: {
      tenantId: createdTenant.id,
      firstName: "Admin",
      lastName: "User",
      email: adminEmail,
      password: await bcrypt.hash(password, 10),
      role: "admin",
    },
  });

  console.log(`Tenant "${tenant.siteName}" (${createdTenant.id}) seeded.`);
  console.log(`Admin login: ${adminEmail}`);
}
