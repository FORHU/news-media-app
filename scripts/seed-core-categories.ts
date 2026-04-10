import { prisma } from "../src/lib/db";

const CORE_CATEGORIES = [
  "World News",
  "Local Updates",
  "Markets",
  "Startups",
  "AI & Innovation",
  "Health & Wellness",
  "Travel",
  "Entertainment & Culture",
  "Sports & Fitness",
  "Automotive",
  "Education & Learning",
  "Personal Development",
  "Editorials/Opinions",
  "Creative Writing",
  "DIY and How to"
];

async function main() {
  console.log("Seeding core English categories...");
  
  for (const name of CORE_CATEGORIES) {
    const existing = await prisma.category.findFirst({
        where: {
            categoryName: {
                equals: name,
                mode: 'insensitive'
            }
        }
    });

    if (existing) {
        if (existing.categoryName !== name) {
            console.log(`Updating ${existing.categoryName} -> ${name}`);
            await prisma.category.update({
                where: { id: existing.id },
                data: { categoryName: name }
            });
        } else {
            console.log(`Category exists: ${name}`);
        }
    } else {
      console.log(`Creating category: ${name}`);
      await prisma.category.create({
        data: { categoryName: name },
      });
    }
  }
  
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
