import "dotenv/config";
import { prisma } from "../../src/lib/db";
import { articles } from "./articles";

const skyBluePrimeCategories = [
  "Artificial Intelligence & Machine Learning",
  "Software Development & Open Source",
  "Consumer Tech & Hardware",
  "Cybersecurity & Digital Privacy",
  "Startups & Venture Capital",
  "Big Tech & Market Trends",
  "Tech Policy, Law, & Regulation",
  "Emerging Tech & Frontier Sciences",
  "Digital Culture & Creator Economy",
  "Enterprise & Cloud Infrastructure",
];

async function main() {
  console.log("Seeding articles for skyblueprime.com...");
  const tenant = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM public.tenants WHERE domain = $1`, "skyblueprime.com"
  );

  if (tenant.length === 0) {
    console.error("skyblueprime.com tenant not found!");
    process.exit(1);
  }

  const tenantId = tenant[0].id;
  const user = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM public.users WHERE tenant_id = $1 LIMIT 1`, tenantId
  );

  if (user.length === 0) {
    console.error("No user found for skyblueprime.com tenant!");
    process.exit(1);
  }
  const userId = user[0].id;

  // Ensure categories exist
  const categoryMap: Record<string, string> = {};

  for (const catName of skyBluePrimeCategories) {
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
  
  let i = 0;
  for (const a of articles) {
    // Round-robin assign articles to the tech categories
    const techCategoryName = skyBluePrimeCategories[i % skyBluePrimeCategories.length];
    const categoryId = categoryMap[techCategoryName];
    
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
           trendingScore: Math.floor(Math.random() * 100),
         } as any
       });
       console.log(`Inserted: ${a.title} in ${techCategoryName}`);
    } else {
       console.log(`Skipped existing: ${a.title}`);
    }
    i++;
  }

  console.log("Finished seeding skyblueprime.com articles.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
