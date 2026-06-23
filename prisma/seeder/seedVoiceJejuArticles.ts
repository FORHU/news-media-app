import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { articles } from "./articles";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const VOICE_JEJU_CATEGORIES = [
  "제주 오늘",
  "여행 및 관광",
  "음식 및 맛집",
  "쇼핑 및 시장",
  "숙박 정보",
  "교통 및 이동",
  "이벤트 및 축제",
  "자연 및 아웃도어",
  "비자 및 입국 정보",
  "로컬 비즈니스 및 생활"
];

async function main() {
  console.log("Seeding articles for voicejeju.com...");

  // 1. Get or Create Tenant
  let tenant = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM public.tenants WHERE domain = $1`, "voicejeju.com"
  );

  if (tenant.length === 0) {
    console.log("voicejeju.com tenant not found, creating...");
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.tenants (id, domain, updated_at) VALUES (gen_random_uuid()::text, $1, NOW())`, "voicejeju.com"
    );
    tenant = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM public.tenants WHERE domain = $1`, "voicejeju.com"
    );
  }

  const tenantId = tenant[0].id;

  // 2. Get or Create Admin User
  let user = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM public.users WHERE tenant_id = $1 LIMIT 1`, tenantId
  );

  if (user.length === 0) {
    console.log("No user found for voicejeju.com, creating admin...");
    // We assume there's a base user or we just create a dummy one for relation
    // In a real app, you'd use supabase auth id, but for local mock we just need a valid UUID in the DB
    await prisma.$executeRawUnsafe(
      `INSERT INTO public.users (id, tenant_id, email, role, updated_at) VALUES ($1, $2, $3, $4, NOW())`,
      crypto.randomUUID(), tenantId, "admin@voicejeju.com", "admin"
    );
    user = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM public.users WHERE tenant_id = $1 LIMIT 1`, tenantId
    );
  }
  const userId = user[0].id;

  // 3. Ensure Categories exist
  const categoryMap: Record<string, string> = {};
  for (const catName of VOICE_JEJU_CATEGORIES) {
    let cat = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM public.categories WHERE tenant_id = $1 AND category_name = $2`, tenantId, catName
    );
    if (cat.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.categories (id, tenant_id, category_name, updated_at) VALUES (gen_random_uuid()::text, $1, $2, NOW())`, tenantId, catName
      );
      cat = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM public.categories WHERE tenant_id = $1 AND category_name = $2`, tenantId, catName
      );
    }
    categoryMap[catName] = cat[0].id;
  }

  console.log("Generating 200 articles for VoiceJeju...");

  for (let i = 0; i < 200; i++) {
    const template = articles[i % articles.length];
    const categoryName = VOICE_JEJU_CATEGORIES[i % VOICE_JEJU_CATEGORIES.length];
    const categoryId = categoryMap[categoryName];

    // Add more variation to titles
    const prefixes = ["Premium:", "Breaking:", "Exclusive:", "Latest:", "Insight:", "Deep Dive:", "Focus:", "Global:", "Local:"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const title = `${prefix} ${template.title} (Batch ${Math.floor(i / articles.length) + 1} - #${i + 1})`;

    // Check if exists
    const existing = await prisma.contentArticle.findFirst({
      where: {
        tenantId,
        title: title
      }
    });

    if (!existing) {
      await prisma.contentArticle.create({
        data: {
          tenantId,
          usersId: userId,
          categoryId,
          title: title,
          content: template.content,
          imageUrl: template.imageUrl,
          status: i % 5 === 0 ? "blog" : "published", // Mix some blogs for "Discover" section
          trendingScore: Math.floor(Math.random() * 100),
          createdAt: new Date(Date.now() - (i * 3600000)) // Spread them out by hour
        } as Parameters<PrismaClient["contentArticle"]["create"]>[0]["data"]
      });
    }
  }

  console.log("Finished seeding VoiceJeju articles.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
