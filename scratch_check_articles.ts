import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.contentArticle.findMany({
    select: { id: true, title: true, status: true, tenantId: true }
  });
  console.log('Articles found:', JSON.stringify(articles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
