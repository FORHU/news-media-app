import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT tenants.domain, content_articles.status, COUNT(*) 
    FROM content_articles 
    JOIN tenants ON content_articles.tenant_id = tenants.id 
    GROUP BY tenants.domain, content_articles.status
  `;
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
