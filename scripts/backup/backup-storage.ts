import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BackupSupabaseClient = SupabaseClient;
import fs from "fs";
import path from "path";
import {
  ensureDir,
  getBackupRoot,
  isDirectScriptRun,
  requireEnv,
  writeManifest,
} from "./lib";

const LIST_LIMIT = 1000;

async function listAllObjectPaths(
  supabase: BackupSupabaseClient,
  bucket: string,
  prefix = ""
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: LIST_LIMIT,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Failed to list "${prefix || "/"}": ${error.message}`);
    }

    if (!data?.length) break;

    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

      // Supabase uses id === null for folder placeholders.
      if (item.id === null) {
        const nested = await listAllObjectPaths(supabase, bucket, itemPath);
        paths.push(...nested);
        continue;
      }

      paths.push(itemPath);
    }

    if (data.length < LIST_LIMIT) break;
    offset += LIST_LIMIT;
  }

  return paths;
}

export async function backupStorage(): Promise<{
  backupRoot: string;
  bucket: string;
  downloaded: number;
  failed: string[];
  totalBytes: number;
}> {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  const bucket = process.env.SUPABASE_ARTICLES_BUCKET?.trim() || "articles";
  const backupRoot = getBackupRoot();
  const storageRoot = path.join(backupRoot, "storage", bucket);
  ensureDir(storageRoot);

  const supabase: BackupSupabaseClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  console.log(`[storage] Bucket: ${bucket}`);
  console.log(`[storage] Listing objects...`);

  const objectPaths = await listAllObjectPaths(supabase, bucket);
  console.log(`[storage] Found ${objectPaths.length} file(s)`);

  const failed: string[] = [];
  let downloaded = 0;
  let totalBytes = 0;

  for (const objectPath of objectPaths) {
    const dest = path.join(storageRoot, ...objectPath.split("/"));
    ensureDir(path.dirname(dest));

    const { data, error } = await supabase.storage.from(bucket).download(objectPath);
    if (error || !data) {
      failed.push(objectPath);
      console.error(`[storage] ✗ ${objectPath}: ${error?.message ?? "no data"}`);
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    downloaded += 1;
    totalBytes += buffer.length;
    console.log(`[storage] ✓ ${objectPath}`);
  }

  return { backupRoot, bucket, downloaded, failed, totalBytes };
}

export async function main(): Promise<void> {
  const result = await backupStorage();
  writeManifest(result.backupRoot, {
    type: "storage",
    createdAt: new Date().toISOString(),
    bucket: result.bucket,
    downloaded: result.downloaded,
    failed: result.failed,
    totalBytes: result.totalBytes,
    outputDir: path.join("storage", result.bucket),
  });

  console.log(
    `[storage] Done. ${result.downloaded} file(s), ${(result.totalBytes / 1024).toFixed(1)} KB`
  );
  if (result.failed.length > 0) {
    console.warn(`[storage] ${result.failed.length} file(s) failed to download.`);
    process.exitCode = 1;
  }
}

if (isDirectScriptRun("backup-storage")) {
  main().catch((error) => {
    console.error(
      "[storage] Backup failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  });
}
