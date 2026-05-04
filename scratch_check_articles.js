const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString, max: 5, options: "-c search_path=public" });
  const prisma = new PrismaClient({ adapter });

  const articles = await prisma.contentArticle.findMany({
    select: { id: true, title: true, status: true, tenantId: true }
  });
  console.log('Articles found:', JSON.stringify(articles, null, 2));
  
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants found:', JSON.stringify(tenants, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
