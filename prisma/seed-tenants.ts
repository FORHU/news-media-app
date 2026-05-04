import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedNewsIconsTenants } from "./seeder/newsIconsTenants";

async function main() {
  try {
    await seedNewsIconsTenants(prisma);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
