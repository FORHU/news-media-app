import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedPressBigTenant } from "./seeder/pressbigTenant";

async function main() {
  try {
    await seedPressBigTenant(prisma);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
