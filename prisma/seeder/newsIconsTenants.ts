import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";

const tenants = [
  {
    domain: "newsicons.com",
    slug: "newsicons",
    siteName: "News Icons",
  },
  {
    domain: "jejutime.com",
    slug: "jejutime",
    siteName: "Jeju Time",
  },
  {
    domain: "jejuqq.com",
    slug: "jejuqq",
    siteName: "Jeju QQ",
  },
  {
    domain: "jejujapan.com",
    slug: "jejujapan",
    siteName: "Jeju Japan",
  },
  {
    domain: "skyblueprime.com",
    slug: "skyblueprime",
    siteName: "Sky Blue Prime",
  },
];

export async function seedNewsIconsTenants(prisma: PrismaClient) {
  console.log("Seeding News Icons Tenants and Admins explicitly into public schema...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  for (const t of tenants) {
    console.log(`Processing tenant in public: ${t.domain}`);
    
    // Check if tenant exists in public
    const existingTenants = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM public.tenants WHERE domain = $1`, t.domain
    );
    
    let tenantId: string;
    
    if (existingTenants.length > 0) {
      tenantId = existingTenants[0].id;
      console.log(`Updating existing tenant ${t.domain} (ID: ${tenantId}) in public`);
      await prisma.$executeRawUnsafe(`
        UPDATE public.tenants 
        SET slug = $1, site_name = $2, is_active = $3, updated_at = NOW()
        WHERE id = $4
      `, t.slug, t.siteName, true, tenantId);
    } else {
      tenantId = t.slug; // Use slug as ID for new tenants if we can't generate a CUID easily
      console.log(`Inserting new tenant ${t.domain} (ID: ${tenantId}) into public`);
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.tenants (id, slug, domain, site_name, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, tenantId, t.slug, t.domain, t.siteName, true);
    }

    const adminEmail = `admin@${t.domain}`;
    console.log(`Upserting admin for ${t.domain} in public: ${adminEmail}`);

    // Check if user exists for this tenant in public
    const existingUsers = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM public.users WHERE tenant_id = $1 AND email = $2`, tenantId, adminEmail
    );

    if (existingUsers.length > 0) {
      console.log(`Updating existing admin for ${t.domain} in public`);
      await prisma.$executeRawUnsafe(`
        UPDATE public.users
        SET first_name = $1, last_name = $2, password = $3, role = $4, updated_at = NOW()
        WHERE id = $5
      `, "Admin", "User", hashedPassword, "admin", existingUsers[0].id);
    } else {
      const userId = `admin-${t.slug}`;
      console.log(`Inserting new admin for ${t.domain} in public`);
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.users (id, tenant_id, first_name, last_name, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, userId, tenantId, "Admin", "User", adminEmail, hashedPassword, "admin");
    }
  }

  console.log("News Icons Tenants and Admins seeded successfully into public.");
}
