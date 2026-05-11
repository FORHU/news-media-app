import { prisma } from "../src/lib/db";

async function checkArticle() {
  const article = await prisma.contentArticle.findFirst({
    where: { slug: "2026-05-05-experience-beauty-hydrangea-jeju-hyueari" }
  });

  if (!article) {
    console.log("Article not found.");
    return;
  }

  const contentSize = Buffer.byteLength(article.content || "", "utf8");
  const sizeInMB = (contentSize / (1024 * 1024)).toFixed(2);
  
  console.log(`Article slug: ${article.slug}`);
  console.log(`Content size: ${sizeInMB} MB`);
  
  if (article.content && article.content.includes("data:image/")) {
    console.log("WARNING: Content contains base64 images!");
    // Count how many base64 images
    const matches = article.content.match(/data:image\/[a-zA-Z]*;base64,/g);
    console.log(`Found ${matches?.length || 0} inline base64 images.`);
  }
}

checkArticle()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
