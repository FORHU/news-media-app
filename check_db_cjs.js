const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.contentArticle.groupBy({
    by: ['status', 'tenantId'],
    _count: {
      _all: true
    }
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
