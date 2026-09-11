import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";

const tenants = [
  {
    slug: "techoggi",
    domain: "techoggi.com",
    siteName: "Tech Oggi",
    // "Tech Oggi" = "Tech Today" in Italian — Italian-language site.
    defaultLanguage: "it",
  },
  {
    slug: "technikpost",
    domain: "technikpost.de",
    siteName: "Technik Post",
    // .de domain — German-language site.
    defaultLanguage: "de",
  },
];

export async function seedNewDomainsTenants(prisma: PrismaClient) {
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
