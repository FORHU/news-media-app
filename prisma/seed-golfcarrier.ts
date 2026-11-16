import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedGolfCarrierTenant } from "./seeder/golfcarrierTenant";

async function main() {
  try {
    await seedGolfCarrierTenant(prisma);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
