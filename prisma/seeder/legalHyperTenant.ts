import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";

const tenant = {
  slug: "legalhyper",
  domain: "legalhyper.com",
  siteName: "Legal Hyper",
  defaultLanguage: "en",
};

const admin = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@legalhyper.com",
  password: "admin123",
};

export async function seedLegalHyperTenant(prisma: PrismaClient) {
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

  const hashedPassword = await bcrypt.hash(admin.password, 10);

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: createdTenant.id,
        email: admin.email,
      },
    },
    update: {
      firstName: admin.firstName,
      lastName: admin.lastName,
      password: hashedPassword,
      role: "admin",
    },
    create: {
      tenantId: createdTenant.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log(`Tenant "${tenant.siteName}" (${createdTenant.id}) and admin ${admin.email} seeded.`);
}
