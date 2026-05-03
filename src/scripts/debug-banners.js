const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

async function main() {
  try {
    const banners = await prisma.banner.findMany({
      include: { tenant: true }
    });
    console.log("Banners Count:", banners.length);
    banners.forEach(b => {
      console.log(`Banner: ${b.name}, Tenant Domain: ${b.tenant.domain}, Positions: [${b.positions.join(', ')}]`);
    });
  } catch (err) {
    console.error("Debug failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
