import "dotenv/config";
import { prisma } from "./src/lib/db";

async function check() {
  try {
    const prismaTenantCount = await prisma.tenant.count();
    console.log('Tenant count (via prisma client):', prismaTenantCount);

    const prismaArticleCount = await prisma.contentArticle.count();
    console.log('Article count (via prisma client):', prismaArticleCount);

    const searchPath = await prisma.$queryRawUnsafe('SHOW search_path');
    console.log('Current database search_path:', searchPath);

  } catch (e) {
    console.error('Check failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
