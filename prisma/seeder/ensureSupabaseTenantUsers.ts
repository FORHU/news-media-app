import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../../src/lib/db";
import { supabaseAdmin } from "../../src/lib/supabaseAdmin";

type TenantSeed = {
  domain: string;
  email: string;
  password: string;
};

const TENANT_ADMINS: TenantSeed[] = [
  { domain: "korea.com", email: "editor+korea@newsmedia.app", password: "change-me-in-production" },
  {
    domain: "japanese.com",
    email: "editor+japanese@newsmedia.app",
    password: "change-me-in-production",
  },
  { domain: "chinese.com", email: "editor+chinese@newsmedia.app", password: "change-me-in-production" },
];

async function ensurePrismaUser(t: TenantSeed) {
  const tenant = await prisma.tenant.findUnique({ where: { domain: t.domain } });
  if (!tenant) throw new Error(`Tenant not found for domain: ${t.domain}`);

  const existing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: t.email },
  });
  if (existing) return existing;

  const hashedPassword = await bcrypt.hash(t.password, 10);
  return prisma.user.create({
    data: {
      tenantId: tenant.id,
      firstName: "Editor",
      lastName: "User",
      email: t.email,
      password: hashedPassword,
      role: "admin",
    },
  });
}

async function listSupabaseUsersOnce() {
  const { users } = await supabaseAdmin.auth.admin.listUsers();
  return users ?? [];
}

async function ensureSupabaseUserPassword(t: TenantSeed, cachedUsers: any[]) {
  const existing = cachedUsers.find((u) => u.email === t.email);

  if (!existing) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: t.email,
      password: t.password,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });
    if (error) {
      // If something races with another script, rethrow.
      throw new Error(`Supabase createUser failed for ${t.email}: ${error.message}`);
    }
    return;
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
    password: t.password,
  });
  if (error) {
    throw new Error(`Supabase updateUserById failed for ${t.email}: ${error.message}`);
  }
}

async function main() {
  const cachedUsers = await listSupabaseUsersOnce();

  for (const t of TENANT_ADMINS) {
    console.log(`Ensuring admin auth for ${t.email} (${t.domain})...`);
    await ensurePrismaUser(t);
    await ensureSupabaseUserPassword(t, cachedUsers);
  }

  console.log("Supabase tenant admin users ensured.");
}

main()
  .catch((e) => {
    console.error("ensureSupabaseTenantUsers failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

