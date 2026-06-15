/**
 * Migrates article images from Supabase Storage → S3 (newsicons-dev).
 * Handles two cases:
 *
 *   1. Raw Supabase Storage URL in DB
 *      → download from Supabase, upload to S3, update DB
 *
 *   2. S3 URL whose key is an embedded Supabase URL (from a previous partial migration)
 *      e.g. https://newsicons-dev.s3.ap-southeast-1.amazonaws.com/https://...supabase.co/...
 *      → re-download from Supabase, re-upload with clean S3 key, update DB
 *
 * Usage:
 *   npx tsx scripts/migrate-storage-to-s3.ts              — dry run (default)
 *   npx tsx scripts/migrate-storage-to-s3.ts --migrate    — actually migrate
 *   npx tsx scripts/migrate-storage-to-s3.ts --check      — connectivity check only
 */

import "dotenv/config";
import { S3Client, PutObjectCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/db";

// ── Config ─────────────────────────────────────────────────────────────────────

const SUPABASE_URL   = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const AWS_BUCKET     = process.env.AWS_S3_BUCKET ?? "";
const AWS_REGION     = process.env.AWS_REGION ?? "ap-southeast-1";
const AWS_ACCESS_KEY = process.env.APP_AWS_ACCESS_KEY ?? process.env.APP_AWS_ACCESS_KEY_ID ?? "";
const AWS_SECRET_KEY = process.env.APP_AWS_SECRET_ACCESS_KEY ?? "";

const JEJU_DOMAINS = ["voicejeju.com", "jejutime.com", "jejuqq.com", "jejujapan.com"];

// Computed after env is loaded
const S3_BASE_URL = () => `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/`;

// ── S3 client ──────────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY },
});

// ── URL classification ─────────────────────────────────────────────────────────

type UrlKind =
  | "supabase"          // raw Supabase Storage URL
  | "s3-supabase-key"   // S3 URL whose key embeds a Supabase URL (bad previous migration)
  | "skip";             // already clean S3 URL or unrelated URL

function classifyUrl(url: string | null | undefined): UrlKind {
  if (!url) return "skip";
  const base = S3_BASE_URL();

  if (!url.startsWith(base) && url.includes("supabase.co/storage/")) return "supabase";
  if (url.startsWith(base) && url.includes("supabase.co")) return "s3-supabase-key";
  return "skip";
}

/**
 * Given an S3 URL whose key is an embedded Supabase URL, extract the original
 * Supabase URL so we can re-download from there.
 *
 * Example:
 *   input:  https://newsicons-dev.s3.ap-southeast-1.amazonaws.com/https://asyjcj...supabase.co/storage/...
 *   output: https://asyjcj...supabase.co/storage/...
 */
function extractSupabaseUrlFromS3(s3Url: string): string {
  const key = decodeURIComponent(s3Url.slice(S3_BASE_URL().length));
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  // Key might be "asyjcj...supabase.co/..." without protocol
  return `https://${key}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function contentTypeFromUrl(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg",
    png: "image/png",  webp: "image/webp",
    gif: "image/gif",  avif: "image/avif",
  };
  return map[ext] ?? "image/jpeg";
}

async function downloadFromSupabase(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadCleanToS3(buffer: Buffer, sourceFilename: string): Promise<string> {
  const filename = sourceFilename.split("/").pop()?.split("?")[0] ?? "image.jpg";
  const slug     = Math.random().toString(36).slice(2, 8);
  const key      = `articles/jeju-migration-${Date.now()}-${slug}-${filename}`;

  await s3.send(new PutObjectCommand({
    Bucket: AWS_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentTypeFromUrl(sourceFilename),
  }));

  return `${S3_BASE_URL()}${key}`;
}

/**
 * Resolves a URL that needs migration (either kind) into a clean S3 URL.
 * Downloads from Supabase in both cases; for s3-supabase-key, the embedded
 * Supabase URL is extracted first.
 */
async function resolveToCleanS3(url: string, kind: UrlKind): Promise<string> {
  const supabaseUrl = kind === "s3-supabase-key" ? extractSupabaseUrlFromS3(url) : url;
  const buffer      = await downloadFromSupabase(supabaseUrl);
  return uploadCleanToS3(buffer, supabaseUrl);
}

// ── Connectivity checks ────────────────────────────────────────────────────────

async function checkSupabase(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 402) {
      console.error("  ❌ Supabase 402 — project is paused / quota exceeded.");
      console.error("     Upgrade to Pro or wait for quota reset (July 1, 2026).");
      return false;
    }
    if (!res.ok) {
      console.error(`  ❌ Supabase ${res.status} ${res.statusText}`);
      return false;
    }
    console.log("  ✅ Supabase Storage is accessible.");
    return true;
  } catch (err: any) {
    console.error(`  ❌ Supabase unreachable: ${err.message}`);
    return false;
  }
}

async function checkS3(): Promise<boolean> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: AWS_BUCKET }));
    console.log(`  ✅ S3 bucket "${AWS_BUCKET}" is accessible.`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ S3 bucket "${AWS_BUCKET}": ${err.message}`);
    return false;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args      = process.argv.slice(2);
  const isDryRun  = !args.includes("--migrate");
  const checkOnly = args.includes("--check");

  console.log("\n══════════════════════════════════════════════════════");
  console.log("  Supabase Storage → S3 Migration");
  console.log("══════════════════════════════════════════════════════\n");

  const missing = [
    !SUPABASE_URL   && "NEXT_PUBLIC_SUPABASE_URL",
    !SUPABASE_KEY   && "SUPABASE_SERVICE_ROLE_KEY",
    !AWS_BUCKET     && "AWS_S3_BUCKET",
    !AWS_ACCESS_KEY && "APP_AWS_ACCESS_KEY",
    !AWS_SECRET_KEY && "APP_AWS_SECRET_ACCESS_KEY",
  ].filter(Boolean);

  if (missing.length) {
    console.error("Missing env vars:", missing.join(", "));
    process.exit(1);
  }

  console.log("Checking connectivity…");
  const supabaseOk = await checkSupabase();
  const s3Ok       = await checkS3();
  console.log();

  if (checkOnly) process.exit(supabaseOk && s3Ok ? 0 : 1);

  if (!supabaseOk || !s3Ok) {
    console.error("Fix connectivity issues before running.");
    process.exit(1);
  }

  // ── Load all Jeju articles ───────────────────────────────────────────────────
  const allArticles = await prisma.contentArticle.findMany({
    where: { tenant: { domain: { in: JEJU_DOMAINS } } },
    select: { id: true, title: true, imageUrl: true, imageUrls: true, tenant: { select: { domain: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Keep only articles that have at least one URL that needs work
  const toMigrate = allArticles.filter((a) => {
    const primaryKind = classifyUrl(a.imageUrl);
    const arrayKinds  = a.imageUrls.map(classifyUrl);
    return primaryKind !== "skip" || arrayKinds.some((k) => k !== "skip");
  });

  // Tally by type for the header
  let rawSupabaseCount   = 0;
  let s3SupabaseKeyCount = 0;
  for (const a of toMigrate) {
    const all = [a.imageUrl, ...a.imageUrls];
    for (const u of all) {
      const k = classifyUrl(u);
      if (k === "supabase")        rawSupabaseCount++;
      if (k === "s3-supabase-key") s3SupabaseKeyCount++;
    }
  }

  console.log(`Found ${toMigrate.length} article(s) across ${JEJU_DOMAINS.join(", ")}`);
  console.log(`  ${rawSupabaseCount} raw Supabase URL(s)          → will download & upload to S3`);
  console.log(`  ${s3SupabaseKeyCount} S3 URL(s) with Supabase key → will re-upload with clean S3 key`);
  console.log();

  if (isDryRun) console.log("── DRY RUN ── pass --migrate to execute\n");

  // ── Process articles ─────────────────────────────────────────────────────────
  let migrated = 0;
  let failed   = 0;

  for (const [i, article] of toMigrate.entries()) {
    const prefix     = `[${String(i + 1).padStart(3)}/${toMigrate.length}]`;
    const domain     = article.tenant?.domain ?? "unknown";
    const shortTitle = article.title.slice(0, 50);

    console.log(`${prefix} ${domain.padEnd(16)} ${shortTitle}`);

    const primaryKind = classifyUrl(article.imageUrl);

    if (isDryRun) {
      if (primaryKind !== "skip") {
        const label = primaryKind === "supabase" ? "supabase URL" : "S3 with Supabase key";
        console.log(`         imageUrl  [${label}] → would upload to S3`);
      }
      for (const url of article.imageUrls) {
        const k = classifyUrl(url);
        if (k !== "skip") {
          const label = k === "supabase" ? "supabase URL" : "S3 with Supabase key";
          console.log(`         imageUrls [${label}] → would upload to S3`);
        }
      }
      migrated++;
      continue;
    }

    // ── Real migration ──────────────────────────────────────────────────────────
    try {
      let newImageUrl  = article.imageUrl;
      let newImageUrls = [...article.imageUrls];
      let anyChange    = false;

      if (primaryKind !== "skip") {
        newImageUrl = await resolveToCleanS3(article.imageUrl!, primaryKind);
        anyChange   = true;
        console.log(`         ✅ imageUrl  → ${newImageUrl}`);
      }

      newImageUrls = await Promise.all(
        article.imageUrls.map(async (url) => {
          const k = classifyUrl(url);
          if (k === "skip") return url;
          const cleanUrl = await resolveToCleanS3(url, k);
          anyChange = true;
          return cleanUrl;
        })
      );

      if (anyChange) {
        await prisma.contentArticle.update({
          where: { id: article.id },
          data: { imageUrl: newImageUrl, imageUrls: newImageUrls },
        });
        migrated++;
      }
    } catch (err: any) {
      console.error(`         ❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  if (isDryRun) {
    console.log(`  DRY RUN — ${migrated} article(s) would be migrated.`);
    console.log();
    console.log("  Run the real migration:");
    console.log("  npx tsx scripts/migrate-storage-to-s3.ts --migrate");
  } else {
    console.log(`  ✅ Migrated : ${migrated}`);
    console.log(`  ❌ Failed   : ${failed}`);
    if (failed > 0) {
      console.log();
      console.log("  Re-run to retry failed articles:");
      console.log("  npx tsx scripts/migrate-storage-to-s3.ts --migrate");
    }
  }
  console.log("══════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect().catch(() => {}));
