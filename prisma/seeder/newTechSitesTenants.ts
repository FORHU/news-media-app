import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";

const tenants = [
  {
    slug: "linktechnews",
    domain: "linktechnews.com",
    siteName: "Link Tech News",
    defaultLanguage: "en",
  },
  {
    slug: "dbtechnews",
    domain: "dbtechnews.com",
    siteName: "DB Tech News",
    defaultLanguage: "en",
  },
  {
    slug: "magazinetechy",
    domain: "magazinetechy.com",
    siteName: "Magazine Techy",
    defaultLanguage: "en",
  },
  {
    slug: "magazineair",
    domain: "magazineair.com",
    siteName: "Magazine Air",
    defaultLanguage: "en",
  },
  {
    slug: "techygate",
    domain: "techygate.com",
    siteName: "Techy Gate",
    defaultLanguage: "en",
  },
  {
    slug: "newyorksignal",
    domain: "newyorksignal.com",
    siteName: "New York Signal",
    defaultLanguage: "en",
  },
];

export async function seedNewTechSitesTenants(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  for (const tenant of tenants) {
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
}
