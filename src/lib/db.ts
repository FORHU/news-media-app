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

// During build: allow enough connections for parallel tenant queries in generateStaticParams.
// During runtime: cap at 5 to avoid exhausting Supabase's connection limit.
const maxConnections = process.env.NEXT_PHASE === "phase-production-build" ? 5 : 5;

const pool: Pool = g.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: maxConnections,
  // During build, give more time for sequential queries to queue through the single connection.
  connectionTimeoutMillis: process.env.NEXT_PHASE === "phase-production-build" ? 30000 : 5000,
  idleTimeoutMillis: 30000,
});

// Cache in globalThis for BOTH dev (prevent hot-reload exhaustion)
// and prod (reuse pool across warm Vercel invocations)
g.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma: PrismaClient = g.prisma ?? new PrismaClient({ adapter });
g.prisma = prisma;
