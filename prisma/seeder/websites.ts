import "dotenv/config";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { prisma } from "../../src/lib/db";

type WebsiteSeed = {
  slug: string;
  domain: string;
  siteName: string;
  defaultLanguage: string;
  // For now, we reuse the same sample article body across all websites.
  articleTitle: string;
  articleSlug: string;
};

const websites: WebsiteSeed[] = [
  {
    slug: "korea",
    domain: "korea.com",
    siteName: "Korea",
    defaultLanguage: "ko",
    articleTitle: "Korea sample article",
    articleSlug: "korea-sample-1",
  },
  {
    slug: "japanese",
    domain: "japanese.com",
    siteName: "Japanese",
    defaultLanguage: "ja",
    articleTitle: "Korea sample article",
    articleSlug: "japanese-sample-1",
  },
  {
    slug: "chinese",
    domain: "chinese.com",
    siteName: "Chinese",
    defaultLanguage: "zh",
    articleTitle: "Korea sample article",
    articleSlug: "chinese-sample-1",
  },
];

async function upsertTenant(p: PrismaClient, w: WebsiteSeed) {
  return await p.tenant.upsert({
    where: { domain: w.domain },
    update: {
      slug: w.slug,
      siteName: w.siteName,
      defaultLanguage: w.defaultLanguage,
      isActive: true,
    },
    create: {
      slug: w.slug,
      domain: w.domain,
      siteName: w.siteName,
      defaultLanguage: w.defaultLanguage,
      isActive: true,
    },
  });
}

async function ensureUser(p: PrismaClient, tenantId: string, email: string) {
  const existing = await p.user.findFirst({ where: { tenantId, email } });
  if (existing) return existing;

  const hashedPassword = await bcrypt.hash("change-me-in-production", 10);
  return await p.user.create({
    data: {
      tenantId,
      firstName: "Editor",
      lastName: "User",
      email,
      password: hashedPassword,
      role: "admin",
    },
  });
}

async function ensureCategory(p: PrismaClient, tenantId: string, categoryName: string) {
  const existing = await p.category.findFirst({ where: { tenantId, categoryName } });
  if (existing) return existing;

  return await p.category.create({
    data: {
      tenantId,
      categoryName,
    },
  });
}

async function ensureContentArticle(p: PrismaClient, args: {
  tenantId: string;
  userId: string;
  categoryId: string;
  title: string;
  slug: string;
}) {
  const existing = await p.contentArticle.findUnique({ where: { slug: args.slug } });
  if (existing) return existing;

  return await p.contentArticle.create({
    data: {
      tenantId: args.tenantId,
      usersId: args.userId,
      categoryId: args.categoryId,
      title: args.title,
      slug: args.slug,
      content:
        "This is a sample article seeded for local development. Replace this content with real website content later.",
      status: "pending",
      // SOURCE is optional because schema has a default, but we set it explicitly for clarity.
      sourceType: "ARTICLE" as any,
      imageUrl: "https://placehold.co/1200x675/png",
    },
  });
}

export async function seedWebsitesAndContents() {
  const p = prisma;

  if (!p) throw new Error("Prisma client is not initialized.");

  const articleCategoryName = "Local Updates";
  for (const w of websites) {
    const tenant = await upsertTenant(p, w);
    const user = await ensureUser(p, tenant.id, `editor+${w.slug}@newsmedia.app`);
    const category = await ensureCategory(p, tenant.id, articleCategoryName);

    await ensureContentArticle(p, {
      tenantId: tenant.id,
      userId: user.id,
      categoryId: category.id,
      title: w.articleTitle,
      slug: w.articleSlug,
    });
  }

  console.log("Seeding websites + local contents done.");
}

// Allow running directly: npx tsx prisma/seeder/websites.ts
seedWebsitesAndContents()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });

