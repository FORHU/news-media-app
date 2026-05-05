import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

type GlobalForPrisma = {
  prisma?: PrismaClient;
  pool?: Pool;
};

const g = globalThis as unknown as GlobalForPrisma;

// Use a lower connection limit during build to prevent connection exhaustion.
// On Vercel serverless, pool is cached in globalThis so warm invocations reuse it.
const maxConnections = process.env.NEXT_PHASE === "phase-production-build" ? 1 : 5;

const pool: Pool = g.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: maxConnections,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

// Cache in globalThis for BOTH dev (prevent hot-reload exhaustion)
// and prod (reuse pool across warm Vercel invocations)
g.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma: PrismaClient = g.prisma ?? new PrismaClient({ adapter });
g.prisma = prisma;
