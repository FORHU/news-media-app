import { config } from "dotenv";
import fs from "fs";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });

export function getBackupRoot(): string {
  const date = new Date().toISOString().slice(0, 10);
  const custom = process.env.BACKUP_DIR;
  if (custom) return path.resolve(custom);
  return path.join(process.cwd(), "backups", date);
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeManifest(
  backupRoot: string,
  manifest: Record<string, unknown>
): void {
  const manifestPath = path.join(backupRoot, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
}

export function fileSizeBytes(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/** True when this file is executed directly via tsx (not imported). */
export function isDirectScriptRun(scriptName: string): boolean {
  const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
  return entry.includes(scriptName);
}
