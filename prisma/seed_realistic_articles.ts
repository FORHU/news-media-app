import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("🌱 Starting realistic seed...");

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        firstName: "Test",
        lastName: "Editor",
        email: "editor@newsmedia.app",
        password: "hashedpassword",
      }
    });
  }

  const categoryNames = ["Technology", "Business", "Environment", "Health", "Science", "Lifestyle", "World News"];
  const categoryMap: Record<string, string> = {};

  for (const name of categoryNames) {
    let cat = await prisma.category.findFirst({ where: { categoryName: name } });
    if (!cat) {
      cat = await prisma.category.create({ data: { categoryName: name } });
    }
    categoryMap[name] = cat.id;
  }

  const realisticArticles = [
    {
      title: "The AI Revolution in Healthcare: Personalized Medicine Hits Corporate Clinics",
      content: "Major tech firms are investing billions into AI-driven diagnostic tools that promise to catch diseases years before symptoms appear. This shift toward predictive healthcare is reshaping the insurance landscape...",
      imageUrl: "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=1000&auto=format&fit=crop",
      category: "Health",
      status: "published"
    },
    {
      title: "Quantum Computing: Zurich Startup Unveils First Desktop-Ready Unit",
      content: "For the price of a luxury car, researchers can now own a localized quantum processing unit. This marks the first time such power has been miniaturized from a room-sized lab to a standard desk form factor.",
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000&auto=format&fit=crop",
      category: "Technology",
      status: "published"
    },
    {
      title: "The Rise of 'Bio-Luminescent' Smart Parks in Modern Cities",
      content: "City planners are ditching traditional streetlights in favor of a glowing alternative. Project Aurora uses bio-engineered flora that emits a soft ambient glow, reducing carbon footprints by up to 15%.",
      imageUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop",
      category: "Environment",
      status: "published"
    },
    {
      title: "Global Markets Roil as Sodium-Battery Stocks Surge",
      content: "Wall Street is seeing green as major manufacturers pivot to sodium-ion technology. Abundant and cheaper than lithium, sodium is becoming the gold standard for grid-scale energy storage solutions.",
      imageUrl: "https://images.unsplash.com/photo-1611095773164-12ca3a5ddcc0?q=80&w=1000&auto=format&fit=crop",
      category: "Business",
      status: "published"
    },
    {
      title: "Mars Colony Simulation: 500 Days of Isolation Completed",
      content: "Six volunteers in the Utah desert have completed a record-breaking study on space psychology. The 'Red Horizon' team successfully managed closed-loop resources for over a year, proving mission viability.",
      imageUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop",
      category: "Science",
      status: "published"
    },
    {
      title: "The Renaissance of Vinyl: Analog Sales Reaching New Records",
      content: "Even in a digital-first world, the needle is dropping back on physical media. Gen Z collectors are driving an 18% growth in vinyl LP sales, valuing tactile media over infinite digital streaming.",
      imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=1000&auto=format&fit=crop",
      category: "Lifestyle",
      status: "published"
    },
    {
      title: "Brussels Accord: 40 Nations Sign Global AI Data Treaty",
      content: "In a historic move for digital sovereignty, forty nations have established rules on how AI models can be trained on citizen data, treating it as a natural resource that must be processed locally.",
      imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1000&auto=format&fit=crop",
      category: "World News",
      status: "published"
    },
    {
      title: "Deep-Work Retreats: Why Silicon Valley is Going Offline",
      content: "Companies are booking remote cabins in the Norwegian fjords to combat digital burnout. These 'Silence Sabbaticals' ban smartphones for 6 hours a day, allowing for uninterrupted creative focus.",
      imageUrl: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=1000&auto=format&fit=crop",
      category: "Business",
      status: "published"
    },
    {
      title: "Real Estate Tokenization: Decentralizing the Skyline",
      content: "Property tokenization has reached a record evaluation of $12B globally. Fractional ownership allows small-scale investors to buy pieces of commercial skyscrapers using blockchain technology.",
      imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop",
      category: "Business",
      status: "published"
    },
    {
      title: "Arctic Trade Routes: The Bittersweet Reality of Polar Melt",
      content: "Commercial cargo ships are completing the 'Blue Passage' through the North Pole in record time. While economically efficient, the route is a stark reminder of the accelerating climate crisis.",
      imageUrl: "https://images.unsplash.com/photo-1473081556163-2a17de81fc97?q=80&w=1000&auto=format&fit=crop",
      category: "Environment",
      status: "published"
    },
    {
      title: "The Future of Farming: AI-Driven Vertical Agriculture in Arid Regions",
      content: "Vertical farms in Dubai are reaching production yields equivalent to 1,000 acres of traditional farmland. Sunlight-mimicking LED spectrums and robotic harvesters are making self-sufficiency possible in the desert.",
      imageUrl: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1000&auto=format&fit=crop",
      category: "Environment",
      status: "published"
    },
    {
      title: "Space Tourism: First Commercial Hotel Modules Reach Earth Orbit",
      content: "Orbital Reef has successfully pressurized its first two visitor modules. The hotel, set to open in 2027, will feature zero-gravity dining and a panoramic view of the sunrise every 90 minutes.",
      imageUrl: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?q=80&w=1000&auto=format&fit=crop",
      category: "Science",
      status: "published"
    },
    {
      title: "Ethical AI: The Global Debate Over Machine Consciousness",
      content: "As Large Language Models exhibit increasingly complex reasoning, philosopher-tech teams in Kyoto are proposing 'Digital Sentience Rights'. The move has sparked a fierce debate among silicon manufacturers.",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
      category: "Technology",
      status: "published"
    },
    {
      title: "Neuromorphic Chips: Computing at the Speed of Thought",
      content: "Inspired by the human brain, the latest processors from Intel mimic neural architecture, consuming 90% less energy than standard silicon. This breakthrough could power true AI on mobile devices.",
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop",
      category: "Technology",
      status: "published"
    },
    {
      title: "The Great Reskilling: How Gen Alpha is Redefining the Workforce",
      content: "Digital natives entering junior roles are prioritizing 'dynamic modular work' over 40-hour weeks. Their mastery of prompt engineering and autonomous agents is forcing companies to rewrite the corporate playbook.",
      imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop",
      category: "Lifestyle",
      status: "published"
    },
    {
      title: "Hydrogen Aviation: First Transatlantic Zero-Emission Flight Confirmed",
      content: "A modified regional jet has successfully crossed the Atlantic using liquid hydrogen fuel. The achievement marks a turning point for long-haul travel, proving that high-speed transit doesn't require fossil fuels.",
      imageUrl: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=1000&auto=format&fit=crop",
      category: "Technology",
      status: "published"
    },
    {
      title: "Universal Basic Income: Finland's 5-Year Study Results Are In",
      content: "The final report on the UBI pilot shows a significant increase in mental health and community engagement. While employment rates remained stable, participants reported higher readiness for entrepreneurial ventures.",
      imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
      category: "World News",
      status: "published"
    },
    {
      title: "Sustainable Fashion: Lab-Grown Silk Becomes Mainstream",
      content: "High-end retailers are launching entire collections made from 'Bio-Silk'. Fermented by yeast, this material is stronger than steel and 100% biodegradable, signaling the end of spider-farming ethics debates.",
      imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1000&auto=format&fit=crop",
      category: "Lifestyle",
      status: "published"
    },
    {
      title: "Ocean Cleaning: Great Pacific Garbage Patch Reduced by 25%",
      content: "Using autonomous collection systems, the Ocean Cleanup project has reached a major milestone. Advanced AI tracking now identifies plastic clusters before they break down into microplastics.",
      imageUrl: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80&w=1000&auto=format&fit=crop",
      category: "Environment",
      status: "published"
    },
    {
      title: "Neuro-Gaming: The Next Frontier of Immersive Entertainment",
      content: "A new headset allows players to control in-game movement using brainwave patterns. Early testers report a level of 'presence' impossible with traditional controllers, blurring the line between player and avatar.",
      imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=1000&auto=format&fit=crop",
      category: "Technology",
      status: "published"
    }
  ];

  for (const art of realisticArticles) {
    const categoryId = categoryMap[art.category];
    await prisma.contentArticle.create({
      data: {
        title: art.title,
        content: art.content,
        imageUrl: art.imageUrl,
        status: art.status,
        usersId: user.id,
        categoryId: categoryId,
        publishDate: new Date()
      }
    });
  }

  console.log(`✅ Successfully created ${realisticArticles.length} realistic articles with images.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
