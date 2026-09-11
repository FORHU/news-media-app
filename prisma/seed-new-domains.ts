import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedNewDomainsTenants } from "./seeder/newDomainsTenants";

async function main() {
  try {
    await seedNewDomainsTenants(prisma);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
