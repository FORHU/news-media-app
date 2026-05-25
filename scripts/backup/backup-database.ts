import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { exportDatabaseViaPg } from "./backup-database-pg";
import {
  ensureDir,
  fileSizeBytes,
  getBackupRoot,
  isDirectScriptRun,
  requireEnv,
  writeManifest,
} from "./lib";

type DumpSpec = {
  filename: string;
  schemas: string[];
};

const DUMPS: DumpSpec[] = [
  { filename: "supabase-public.sql", schemas: ["public"] },
  { filename: "supabase-auth.sql", schemas: ["auth"] },
  { filename: "supabase-full.sql", schemas: ["public", "auth"] },
];

function pgDumpCandidates(): string[] {
  const fromEnv = process.env.PG_DUMP_PATH?.trim();
  const candidates = [fromEnv, "pg_dump"].filter(Boolean) as string[];

  if (process.platform === "win32") {
    const programFiles = [
      process.env["ProgramFiles"],
      process.env["ProgramFiles(x86)"],
    ].filter(Boolean) as string[];

    for (const root of programFiles) {
      try {
        const entries = fs.readdirSync(path.join(root, "PostgreSQL"), {
          withFileTypes: true,
        });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            candidates.push(
              path.join(root, "PostgreSQL", entry.name, "bin", "pg_dump.exe")
            );
          }
        }
      } catch {
        // PostgreSQL not installed under Program Files
      }
    }
  }

  return [...new Set(candidates)];
}

function findPgDump(): string {
  for (const candidate of pgDumpCandidates()) {
    const result = spawnSync(candidate, ["--version"], {
      encoding: "utf-8",
      shell: false,
    });
    if (!result.error && result.status === 0) {
      const version = (result.stdout || result.stderr || "").trim();
      if (version) console.log(`[database] ${version}`);
      console.log(`[database] Using ${candidate}`);
      return candidate;
    }
  }

  throw new Error(
    "pg_dump not found. Install PostgreSQL client tools or set PG_DUMP_PATH to pg_dump.exe.\n" +
      "Windows: https://www.postgresql.org/download/windows/"
  );
}

function runPgDump(
  pgDump: string,
  databaseUrl: string,
  outfile: string,
  schemas: string[]
): void {
  const args = [
    databaseUrl,
    ...schemas.flatMap((schema) => ["--schema", schema]),
    "--no-owner",
    "--no-acl",
    "-f",
    outfile,
  ];

  const result = spawnSync(pgDump, args, {
    encoding: "utf-8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    const details = [result.stderr, result.stdout].filter(Boolean).join("\n");
    throw new Error(
      `pg_dump failed for ${path.basename(outfile)} (schemas: ${schemas.join(", ")}).\n${details}`
    );
  }

  const size = fileSizeBytes(outfile);
  if (size === 0) {
    throw new Error(`pg_dump produced an empty file: ${outfile}`);
  }
}

function canUsePgDump(): string | null {
  try {
    return findPgDump();
  } catch {
    return null;
  }
}

async function backupDatabaseWithPg(
  databaseUrl: string,
  backupRoot: string
): Promise<Array<{ filename: string; bytes: number; schemas: string[] }>> {
  console.log(
    "[database] pg_dump not available — using Node.js export (data as INSERT statements)"
  );

  const files: Array<{ filename: string; bytes: number; schemas: string[] }> =
    [];

  for (const spec of DUMPS) {
    const outfile = path.join(backupRoot, spec.filename);
    console.log(
      `[database] Exporting ${spec.schemas.join(" + ")} → ${spec.filename}`
    );
    await exportDatabaseViaPg(databaseUrl, outfile, spec.schemas);
    const bytes = fileSizeBytes(outfile);
    if (bytes === 0) {
      throw new Error(`Export produced an empty file: ${outfile}`);
    }
    files.push({ filename: spec.filename, bytes, schemas: spec.schemas });
    console.log(`[database] ✓ ${spec.filename} (${(bytes / 1024).toFixed(1)} KB)`);
  }

  return files;
}

export async function backupDatabase(): Promise<{
  backupRoot: string;
  files: Array<{ filename: string; bytes: number; schemas: string[] }>;
  method: "pg_dump" | "pg";
}> {
  const databaseUrl = requireEnv("DATABASE_URL");
  const backupRoot = getBackupRoot();
  ensureDir(backupRoot);
  console.log(`[database] Writing to ${backupRoot}`);

  const pgDump = canUsePgDump();
  const files: Array<{ filename: string; bytes: number; schemas: string[] }> =
    [];

  if (pgDump) {
    for (const spec of DUMPS) {
      const outfile = path.join(backupRoot, spec.filename);
      console.log(
        `[database] Dumping ${spec.schemas.join(" + ")} → ${spec.filename}`
      );
      runPgDump(pgDump, databaseUrl, outfile, spec.schemas);
      const bytes = fileSizeBytes(outfile);
      files.push({ filename: spec.filename, bytes, schemas: spec.schemas });
      console.log(
        `[database] ✓ ${spec.filename} (${(bytes / 1024).toFixed(1)} KB)`
      );
    }
    return { backupRoot, files, method: "pg_dump" };
  }

  const pgFiles = await backupDatabaseWithPg(databaseUrl, backupRoot);
  return { backupRoot, files: pgFiles, method: "pg" };
}

export async function main(): Promise<void> {
  const { backupRoot, files, method } = await backupDatabase();
  writeManifest(backupRoot, {
    type: "database",
    method,
    createdAt: new Date().toISOString(),
    files,
  });
  console.log(`[database] Done. Files saved under ${backupRoot}`);
}

if (isDirectScriptRun("backup-database")) {
  main().catch((error) => {
    console.error(
      "[database] Backup failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  });
}
