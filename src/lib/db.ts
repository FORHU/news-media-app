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
  //TO DO: set max to 5 or 10 after switching from supabase session pooler to transaction pooler.
  const adapter = new PrismaPg({ connectionString, max: 5, options: "-c search_path=news_icons,public" });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

