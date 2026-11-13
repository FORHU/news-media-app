import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";

const tenant = {
  slug: "pressbig",
  domain: "pressbig.com",
  siteName: "PressBig",
  defaultLanguage: "en",
};

/**
 * Seeds the pressbig.com tenant and its admin user (idempotent).
 *
 * The admin password ("admin123", as on the other tenants) is only written when
 * the admin user is first created: re-running the seed never resets a password
 * that has since been changed.
 */
export async function seedPressBigTenant(prisma: PrismaClient) {
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
