const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting banner migration...");
  
  // Note: Since Prisma drops the 'position' column when renaming to 'positions',
  // this script assumes that you are running it BEFORE `npx prisma db push` drops the column,
  // by using raw queries, or if you already pushed, the data is gone and this is just a placeholder.
  // Actually, to do this properly with Prisma without dropping data, you'd need an expanding schema 
  // and multiple steps. If the data is already dropped, this won't recover it.

  // Let's try raw query to copy data if `position` column still exists
  try {
    const banners = await prisma.$queryRaw`SELECT id, position FROM banners WHERE position IS NOT NULL`;
    
    console.log(`Found ${banners.length} banners to migrate.`);

    for (const banner of banners) {
      if (banner.position) {
        // Update positions array
        await prisma.$executeRaw`UPDATE banners SET positions = ARRAY[${banner.position}] WHERE id = ${banner.id}`;
        console.log(`Migrated banner ${banner.id} to positions: [${banner.position}]`);
      }
    }
    
    console.log("Migration complete!");
  } catch (error: unknown) {
    console.error("Migration failed or 'position' column no longer exists:");
    console.error(error instanceof Error ? error.message : String(error));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
