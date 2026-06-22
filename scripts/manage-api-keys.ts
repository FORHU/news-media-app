/**
 * Usage:
 *   npx tsx scripts/manage-api-keys.ts              — list all API keys
 *   npx tsx scripts/manage-api-keys.ts enable  <id> — set auto_publish = true
 *   npx tsx scripts/manage-api-keys.ts disable <id> — set auto_publish = false
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  const [, , command, keyId] = process.argv;

  if (!command || command === "list") {
    const keys = await prisma.apiKey.findMany({
      select: {
        id: true,
        sourceName: true,
        isActive: true,
        autoPublish: true,
        expiresAt: true,
        tenant: { select: { domain: true, siteName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log("\n── API Keys ──────────────────────────────────────────────────────");
    console.log(
      "ID".padEnd(30),
      "Source".padEnd(20),
      "Tenant".padEnd(20),
      "Active".padEnd(8),
      "AutoPublish"
    );
    console.log("─".repeat(90));

    for (const k of keys) {
      console.log(
        k.id.padEnd(30),
        k.sourceName.padEnd(20),
        (k.tenant?.domain ?? "").padEnd(20),
        String(k.isActive).padEnd(8),
        k.autoPublish ? "✅ YES" : "❌ no"
      );
    }
    console.log("─".repeat(90));
    console.log(`\n${keys.length} key(s) found.\n`);
    console.log("To enable auto-publish:  npx tsx scripts/manage-api-keys.ts enable  <id>");
    console.log("To disable auto-publish: npx tsx scripts/manage-api-keys.ts disable <id>\n");
    return;
  }

  if (command === "enable" || command === "disable") {
    if (!keyId) {
      console.error(`\nError: missing <id>. Run without arguments first to list keys.\n`);
      process.exit(1);
    }

    const autoPublish = command === "enable";

    const updated = await prisma.apiKey.update({
      where: { id: keyId },
      data: { autoPublish },
      select: { id: true, sourceName: true, autoPublish: true, tenant: { select: { domain: true } } },
    });

    console.log(
      `\n✅ Updated key "${updated.sourceName}" (${updated.tenant?.domain}) → autoPublish = ${updated.autoPublish}\n`
    );
    return;
  }

  console.error(`\nUnknown command "${command}". Use: list | enable | disable\n`);
  process.exit(1);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect().catch(() => {}));
