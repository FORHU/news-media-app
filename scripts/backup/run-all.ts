import fs from "fs";
import path from "path";
import { backupDatabase } from "./backup-database";
import { getBackupRoot, writeManifest } from "./lib";

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const backupRoot = getBackupRoot();

  console.log("=== Database backup ===\n");
  console.log(`Output folder: ${backupRoot}\n`);

  const dbResult = await backupDatabase();

  const summary = {
    type: "full",
    startedAt,
    completedAt: new Date().toISOString(),
    backupRoot,
    database: { method: dbResult.method, files: dbResult.files },
  };

  writeManifest(backupRoot, summary);

  // Human-readable summary
  const summaryPath = path.join(backupRoot, "SUMMARY.txt");
  const lines = [
    `Database backup`,
    `Started:  ${startedAt}`,
    `Finished: ${summary.completedAt}`,
    ``,
    `Database method: ${dbResult.method}`,
    `Database files:`,
    ...dbResult.files.map(
      (f) => `  - ${f.filename} (${(f.bytes / 1024).toFixed(1)} KB)`
    ),
  ];
  fs.writeFileSync(summaryPath, lines.join("\n"), "utf-8");

  console.log("\n=== Backup complete ===");
  console.log(`Folder: ${backupRoot}`);
  console.log(`Summary: ${summaryPath}`);
}

main().catch((error) => {
  console.error("Backup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
