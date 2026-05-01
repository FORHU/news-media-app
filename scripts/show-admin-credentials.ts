import "dotenv/config";
import { prisma } from "../src/lib/db";

async function showCredentials() {
  console.log("\n--- News Icons Admin Credentials ---\n");

  const tenants = await prisma.$queryRawUnsafe<any[]>(`
    SELECT t.site_name, t.domain, u.email, u.role
    FROM public.tenants t
    JOIN public.users u ON t.id = u.tenant_id
    WHERE u.role = 'admin'
    ORDER BY t.site_name ASC
  `);

  if (tenants.length === 0) {
    console.log("No admin users found in public schema.");
  } else {
    console.table(tenants.map(t => ({
      "Site Name": t.site_name,
      "Domain": t.domain,
      "Email": t.email,
      "Password": "admin123" // The password we set in the seeder
    })));
  }

  await prisma.$disconnect();
}

showCredentials();
