import "dotenv/config";
import { prisma } from "../src/lib/db";

async function run() {
  const result = await prisma.contentArticle.updateMany({
    where: { tenant: { domain: 'skyblueprime.com' } },
    data: { status: 'published' }
  });
  console.log(`Updated ${result.count} articles to 'published' for skyblueprime.com`);
}

run().finally(() => prisma.$disconnect());
