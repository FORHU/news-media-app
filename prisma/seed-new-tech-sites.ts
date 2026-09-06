import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedNewTechSitesTenants } from "./seeder/newTechSitesTenants";

async function main() {
  try {
    await seedNewTechSitesTenants(prisma);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
