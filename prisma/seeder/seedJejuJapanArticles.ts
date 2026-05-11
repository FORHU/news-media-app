import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { articles, seedArticles } from "./articles";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding articles for jejujapan.com...");
  const tenant = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM public.tenants WHERE domain = $1`, "jejujapan.com"
  );

  if (tenant.length === 0) {
    console.error("jejujapan.com tenant not found!");
    process.exit(1);
  }

  const tenantId = tenant[0].id;
  const user = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM public.users WHERE tenant_id = $1 LIMIT 1`, tenantId
  );

  if (user.length === 0) {
    console.error("No user found for jejujapan.com tenant!");
    process.exit(1);
  }
  const userId = user[0].id;

  // Ensure categories exist
  const uniqueCategories = [...new Set(articles.map((a) => a.categoryName))];
  const categoryMap: Record<string, string> = {};

  for (const catName of uniqueCategories) {
    let cat = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM public.categories WHERE tenant_id = $1 AND category_name = $2`, tenantId, catName
    );
    if (cat.length === 0) {
       await prisma.$executeRawUnsafe(
         `INSERT INTO public.categories (id, tenant_id, category_name, updated_at) VALUES (gen_random_uuid()::text, $1, $2, NOW())`, tenantId, catName
       );
       cat = await prisma.$queryRawUnsafe<{ id: string }[]>(
         `SELECT id FROM public.categories WHERE tenant_id = $1 AND category_name = $2`, tenantId, catName
       );
    }
    categoryMap[catName] = cat[0].id;
  }

  console.log("Seeding content...");
  
  // Actually, wait, seedArticles expects PrismaClient from src/generated/prisma/client.
  // But maybe the Prisma models aren't fully matching public schema names?
  // Let's use Prisma to insert directly to make sure we follow schema.
  
  for (const a of articles) {
    const categoryId = categoryMap[a.categoryName];
    if (categoryId == null) continue;
    
    // Check if article exists
    const existing = await prisma.contentArticle.findFirst({
      where: {
        tenantId,
        title: a.title
      }
    });
    
    if (!existing) {
       await prisma.contentArticle.create({
         data: {
           tenantId,
           usersId: userId,
           categoryId,
           title: a.title,
           content: a.content,
           imageUrl: a.imageUrl,
           status: a.status,
         } as any
       });
       console.log(`Inserted: ${a.title}`);
    } else {
       console.log(`Skipped existing: ${a.title}`);
    }
  }

  console.log("Finished seeding jejujapan.com articles.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
