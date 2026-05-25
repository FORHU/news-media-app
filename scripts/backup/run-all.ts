import fs from "fs";
import path from "path";
import { backupDatabase } from "./backup-database";
import { backupStorage } from "./backup-storage";
import { getBackupRoot, writeManifest } from "./lib";

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const backupRoot = getBackupRoot();

  console.log("=== Supabase backup ===\n");
  console.log(`Output folder: ${backupRoot}\n`);

  const dbResult = await backupDatabase();
  console.log("");
  const storageResult = await backupStorage();

  const summary = {
    type: "full",
    startedAt,
    completedAt: new Date().toISOString(),
    backupRoot,
    database: { method: dbResult.method, files: dbResult.files },
    storage: {
      bucket: storageResult.bucket,
      downloaded: storageResult.downloaded,
      failed: storageResult.failed,
      totalBytes: storageResult.totalBytes,
    },
  };

  writeManifest(backupRoot, summary);

  // Human-readable summary
  const summaryPath = path.join(backupRoot, "SUMMARY.txt");
  const lines = [
    `Supabase backup`,
    `Started:  ${startedAt}`,
    `Finished: ${summary.completedAt}`,
    ``,
    `Database method: ${dbResult.method}`,
    `Database files:`,
    ...dbResult.files.map(
      (f) => `  - ${f.filename} (${(f.bytes / 1024).toFixed(1)} KB)`
    ),
    ``,
    `Storage bucket: ${storageResult.bucket}`,
    `  - Downloaded: ${storageResult.downloaded} file(s)`,
    `  - Size: ${(storageResult.totalBytes / 1024).toFixed(1)} KB`,
    `  - Failed: ${storageResult.failed.length}`,
  ];
  fs.writeFileSync(summaryPath, lines.join("\n"), "utf-8");

  console.log("\n=== Backup complete ===");
  console.log(`Folder: ${backupRoot}`);
  console.log(`Summary: ${summaryPath}`);

  if (storageResult.failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Backup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
