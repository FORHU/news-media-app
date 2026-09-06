import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedLegalHyperTenant } from "./seeder/legalHyperTenant";

async function main() {
  try {
    await seedLegalHyperTenant(prisma);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
