/**
 * Restore supabase-public.sql (Node/pg INSERT export) into local PostgreSQL.
 *
 * Prerequisite: schema already exists (e.g. npx prisma db push).
 *
 * Prefers `psql` if installed (PostgreSQL client tools, or PSQL_PATH).
 * Otherwise runs statements through the `pg` npm package (same as the app).
 *
 * Usage:
 *   npx tsx scripts/backup/restore-public.ts [path/to/supabase-public.sql]
 *   npm run restore:public -- backups/2026-05-20/supabase-public.sql
 *
 * Env:
 *   DATABASE_URL — target database
 *   RESTORE_SKIP_TRUNCATE=1 — do not TRUNCATE public tables first
 *   PSQL_PATH — full path to psql.exe when not on PATH
 */

import { spawnSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function tryFindPsql(): string | null {
  const fromEnv = process.env.PSQL_PATH?.trim();
  const candidates = [fromEnv, "psql"].filter(Boolean) as string[];

  if (process.platform === "win32") {
    const roots = [
      process.env["ProgramFiles"],
      process.env["ProgramFiles(x86)"],
    ].filter(Boolean) as string[];
    for (const root of roots) {
      try {
        const entries = fs.readdirSync(path.join(root, "PostgreSQL"), {
          withFileTypes: true,
        });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            candidates.push(
              path.join(root, "PostgreSQL", entry.name, "bin", "psql.exe")
            );
          }
        }
      } catch {
        /* no PostgreSQL under Program Files */
      }
    }
  }

  for (const candidate of [...new Set(candidates)]) {
    const result = spawnSync(candidate, ["--version"], {
      encoding: "utf-8",
      shell: false,
    });
    if (!result.error && result.status === 0) {
      return candidate;
    }
  }

  return null;
}

function resolveSqlFile(argPath?: string): string {
  if (argPath) return path.resolve(process.cwd(), argPath);
  const envPath = process.env.RESTORE_SQL_FILE?.trim();
  if (envPath) return path.resolve(process.cwd(), envPath);

  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    throw new Error(
      "No backup path given. Pass path to supabase-public.sql or create backups/ folder."
    );
  }
  const dates = fs
    .readdirSync(backupsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name))
    .sort()
    .reverse();
  if (dates.length === 0) {
    throw new Error(`No dated folders under ${backupsDir}`);
  }
  const latest = path.join(backupsDir, dates[0]!, "supabase-public.sql");
  if (!fs.existsSync(latest)) {
    throw new Error(`Missing file: ${latest}`);
  }
  console.log(`[restore] Using latest backup: ${latest}`);
  return latest;
}

/** Strip outer BEGIN/COMMIT so we can wrap with DISABLE TRIGGER + truncate. */
function extractBackupBody(sql: string): string {
  let body = sql.trim();
  const beginMatch = body.match(/BEGIN;/i);
  if (!beginMatch || beginMatch.index === undefined) {
    throw new Error("Backup SQL must contain a BEGIN; statement");
  }
  body = body
    .slice(beginMatch.index + beginMatch[0].length)
    .trimStart();
  body = body.replace(/\s*COMMIT;\s*$/i, "");
  return body.trim() + "\n";
}

const RESTORE_TABLES = [
  "banners",
  "subscriber_preferences",
  "subscribers",
  "social_media_posts",
  "content_transformations",
  "content_articles",
  "raw_articles",
  "crawled_urls",
  "crawl_jobs",
  "raw_tweets",
  "raw_videos",
  "raw_source_uploads",
  "social_channels",
  "categories",
  "users",
  "tenants",
] as const;

function buildPlainRestoreSql(params: {
  backupBody: string;
  skipTruncate: boolean;
}): string {
  const disable = RESTORE_TABLES.map(
    (t) => `ALTER TABLE IF EXISTS public."${t}" DISABLE TRIGGER ALL;`
  ).join("\n");
  const enable = RESTORE_TABLES.map(
    (t) => `ALTER TABLE IF EXISTS public."${t}" ENABLE TRIGGER ALL;`
  ).join("\n");
  const tableList = RESTORE_TABLES.map((t) => `public."${t}"`).join(", ");
  const truncate = params.skipTruncate
    ? "SELECT 1; -- skip truncate (RESTORE_SKIP_TRUNCATE=1)"
    : `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`;

  return `
BEGIN;

${truncate}

${disable}

${params.backupBody}

${enable}

COMMIT;
`.trim() + "\n";
}

function buildPsqlRestoreSql(params: {
  backupBody: string;
  skipTruncate: boolean;
}): string {
  return `\\set ON_ERROR_STOP on\n\n${buildPlainRestoreSql(params)}`;
}

/** Split on semicolons, respecting single-quoted SQL strings ('' escape). */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let i = 0;
  while (i < sql.length) {
    const c = sql[i]!;
    const next = sql[i + 1];
    if (inSingleQuote) {
      current += c;
      if (c === "'" && next === "'") {
        current += next!;
        i += 2;
        continue;
      }
      if (c === "'") {
        inSingleQuote = false;
      }
      i++;
      continue;
    }
    if (c === "'") {
      inSingleQuote = true;
      current += c;
      i++;
      continue;
    }
    if (c === ";") {
      const t = current.trim();
      if (t.length > 0) statements.push(t);
      current = "";
      i++;
      continue;
    }
    current += c;
    i++;
  }
  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

function isSkippableStatement(sql: string): boolean {
  const lines = sql.trim().split(/\r?\n/);
  const nonComment = lines.filter((line) => {
    const s = line.trim();
    return s.length > 0 && !s.startsWith("--");
  });
  return nonComment.length === 0;
}

async function restoreWithPgClient(
  databaseUrl: string,
  sql: string
): Promise<void> {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 60_000,
  });
  await client.connect();
  try {
    const parts = splitSqlStatements(sql);
    let executed = 0;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (isSkippableStatement(part)) continue;
      await client.query(part);
      executed++;
      if (executed > 0 && executed % 2000 === 0) {
        console.log(`[restore] ... ${executed} statements`);
      }
    }
    console.log(`[restore] Executed ${executed} SQL statements via pg`);
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const databaseUrl = requireEnv("DATABASE_URL");
  const sqlFile =
    process.argv.slice(2).find((a) => !a.startsWith("-")) ?? undefined;
  const resolved = resolveSqlFile(sqlFile);
  const skipTruncate =
    process.env.RESTORE_SKIP_TRUNCATE === "1" ||
    process.env.RESTORE_SKIP_TRUNCATE === "true";

  const raw = fs.readFileSync(resolved, "utf-8");
  const backupBody = extractBackupBody(raw);
  const plainSql = buildPlainRestoreSql({ backupBody, skipTruncate });

  const psqlPath = tryFindPsql();

  if (psqlPath) {
    console.log(`[restore] Using ${psqlPath}`);
    const tmpFile = path.join(
      os.tmpdir(),
      `news-media-restore-${Date.now()}.sql`
    );
    fs.writeFileSync(tmpFile, buildPsqlRestoreSql({ backupBody, skipTruncate }), "utf-8");
    console.log(`[restore] Wrote combined SQL to ${tmpFile}`);

    const result = spawnSync(
      psqlPath,
      [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", tmpFile],
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        shell: false,
        env: { ...process.env, PGCLIENTENCODING: "UTF8" },
      }
    );

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* keep temp file for debugging */
    }

    if (result.status !== 0) {
      throw new Error(`psql exited with code ${result.status}`);
    }
  } else {
    console.log(
      "[restore] psql not found; running restore with the pg driver (may take a few minutes)"
    );
    await restoreWithPgClient(databaseUrl, plainSql);
  }

  console.log("[restore] Done.");
}

main().catch((e) => {
  console.error("[restore] Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
