import "dotenv/config";
import { prisma } from "../src/lib/db";
import { seedTenantCategories } from "./seeder/categories";

/**
 * One sample article on pressbig.com ONLY, so the article page and the way an
 * own story sits next to wire stories can be seen. Idempotent (upsert by slug).
 * Delete it from the admin, or: DELETE FROM content_articles WHERE slug = '<SLUG>'.
 * The text describes PressBig itself and makes no claims about real people or events.
 */
const SLUG = "sample-welcome-to-the-wall";

const CONTENT = `<p>PressBig is a daily edit of entertainment, fashion, gadgets and culture. Instead of a feed that never ends, each section on the home page shows a handful of picks, pasted up like posters on a wall.</p>
<p>Stories from other publishers open in a new tab and stay credited to their source. Stories written for PressBig open right here, on a sheet like this one.</p>
<h2>How the wall works</h2>
<p>Every section is its own layer: Entertainment, Fashion &amp; Style, Gadgets, and Celebrity &amp; Culture. Pick a layer to see everything in it, newest first.</p>
<p>This is a sample article, published so you can see how a PressBig story reads. It can be deleted from the admin at any time.</p>`;

async function main() {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: "pressbig" } });
    if (!tenant) throw new Error("Tenant 'pressbig' not found. Run prisma/seed-pressbig.ts first.");

    const categories = await seedTenantCategories(prisma, "pressbig.com", tenant.id);
    const categoryId = categories["Entertainment"];
    if (!categoryId) throw new Error("Entertainment category missing");

    const admin = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: "admin@pressbig.com" } });
    if (!admin) throw new Error("admin@pressbig.com not found for the pressbig tenant");

    const data = {
      tenantId: tenant.id,
      usersId: admin.id,
      categoryId,
      title: "Welcome to the wall: how PressBig's daily edit works",
      slug: SLUG,
      content: CONTENT,
      imageUrl: "/Logo/PRESSBIG.png",
      status: "published",
      publishDate: new Date(),
      // Pinned so it floats to the top of the edit; unpin it in the admin to see it settle among the wire stories.
      isHeadline: true,
      trendingScore: 100,
    };

    const article = await prisma.contentArticle.upsert({
      where: { slug: SLUG },
      update: data,
      create: data,
      select: { id: true, slug: true, tenantId: true },
    });
    console.log(`Sample article ready on pressbig.com: /article/${article.slug} (tenant ${article.tenantId})`);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
