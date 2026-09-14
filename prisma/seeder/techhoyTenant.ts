import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";

const tenant = {
  slug: "techhoy",
  domain: "techhoy.com",
  siteName: "Tech Hoy",
  // "Tech Hoy" = "Tech Today" in Spanish — Spanish-language site.
  defaultLanguage: "es",
};

export async function seedTechHoyTenant(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash("admin123", 10);

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

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: createdTenant.id,
        email: adminEmail,
      },
    },
    update: {
      firstName: "Admin",
      lastName: "User",
      password: hashedPassword,
      role: "admin",
    },
    create: {
      tenantId: createdTenant.id,
      firstName: "Admin",
      lastName: "User",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log(`Tenant "${tenant.siteName}" (${createdTenant.id}) and admin ${adminEmail} seeded.`);
}
