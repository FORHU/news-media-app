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

function resolvePoolMax(): number {
  const fromEnv = process.env.DATABASE_POOL_MAX;
  if (fromEnv) {
    const parsed = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  // Supabase session pooler (port 5432) caps at ~15 clients per project.
  if (process.env.NEXT_PHASE === "phase-production-build") return 1;
  const url = process.env.DATABASE_URL ?? "";
  const isSupabaseSessionPooler =
    url.includes("pooler.supabase.com") && !url.includes(":6543");
  if (isSupabaseSessionPooler) return 5;
  return process.env.NODE_ENV === "production" ? 10 : 8;
}

const maxConnections = resolvePoolMax();

const databaseUrl = process.env.DATABASE_URL ?? "";
const isRemoteDb = !databaseUrl.includes("sslmode=disable") &&
  !databaseUrl.includes("localhost") &&
  !databaseUrl.includes("127.0.0.1");

const pool: Pool = g.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: maxConnections,
  connectionTimeoutMillis:
    process.env.NEXT_PHASE === "phase-production-build" ? 30000 : 10_000,
  idleTimeoutMillis: 20_000,
  allowExitOnIdle: process.env.NODE_ENV !== "production",
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
});

// Cache in globalThis for BOTH dev (prevent hot-reload exhaustion)
// and prod (reuse pool across warm Vercel invocations)
g.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma: PrismaClient = g.prisma ?? new PrismaClient({ adapter });
g.prisma = prisma;
