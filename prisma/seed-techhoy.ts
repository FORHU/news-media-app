import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedTechHoyTenant } from "./seeder/techhoyTenant";

async function main() {
  try {
    await seedTechHoyTenant(prisma);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
