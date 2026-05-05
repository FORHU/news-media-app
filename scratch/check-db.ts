import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { domain: true, id: true },
  });

  console.log('Tenants:', tenants);

  for (const tenant of tenants) {
    const count = await prisma.contentArticle.count({
      where: { tenantId: tenant.id, status: 'published' }
    });
    console.log(`Tenant ${tenant.domain} has ${count} published articles.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
