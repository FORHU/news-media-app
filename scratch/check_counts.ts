import { PrismaClient } from '@/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', tenants.map((t: any) => ({ id: t.id, name: t.name, domain: t.domain })));

  const categories = await prisma.articleCategory.findMany();
  console.log('Categories:', categories.map((c: any) => c.categoryName));

  for (const tenant of tenants) {
    console.log(`\nTenant: ${tenant.name} (${tenant.id})`);
    const articles = await prisma.contentArticle.count({
      where: { tenantId: tenant.id }
    });
    console.log(`Total articles: ${articles}`);

    const articlesByCategory = await prisma.contentArticle.groupBy({
      by: ['categoryId'],
      where: { tenantId: tenant.id },
      _count: true
    });

    for (const abc of articlesByCategory) {
      const cat = categories.find((c: any) => c.id === abc.categoryId);
      console.log(` - ${cat?.categoryName || 'Unknown'}: ${abc._count}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
