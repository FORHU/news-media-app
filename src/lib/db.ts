import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

type GlobalPrisma = {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as unknown as GlobalPrisma;

function createPrisma(): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // Use a lower connection limit during build to prevent connection exhaustion.
  const maxConnections = process.env.NEXT_PHASE === "phase-production-build" ? 1 : 5;
  const adapter = new PrismaPg({ connectionString, max: maxConnections, options: "-c search_path=public" });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

