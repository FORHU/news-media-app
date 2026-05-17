import "dotenv/config";
import { prisma } from "../../src/lib/db";

const newTechArticles = [
  // AI & Machine Learning
  {
    title: "The Next Leap: GPT-5 Architecture Revealed",
    description: "Researchers discuss the groundbreaking multi-modal neural pathways introduced in the latest iteration of generative models.",
    content: "SAN FRANCISCO — The artificial intelligence community is buzzing as new details emerge regarding the architecture of the upcoming GPT-5 model. Unlike its predecessors, which primarily processed text and basic imagery, the new framework boasts natively integrated multi-modal processing. This means the model processes video, audio, and spatial data simultaneously, creating a more cohesive understanding of the real world. Experts predict this will revolutionize robotics and autonomous driving by providing agents with true contextual awareness.",
    categoryName: "AI & Machine Learning",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "AI Ethics: Solving the 'Black Box' Dilemma",
    description: "A new breakthrough in explainable AI allows developers to map exactly how a neural network reaches its conclusions.",
    content: "LONDON — For years, deep learning models have operated as 'black boxes'—even their creators couldn't fully explain how they made specific decisions. Today, a joint research team from Oxford and MIT published a paper on 'Transparent Backpropagation', a technique that visually maps the decision tree of a neural network in real-time. This breakthrough is expected to accelerate AI adoption in heavily regulated fields such as healthcare and finance, where explainability is a legal requirement.",
    categoryName: "AI & Machine Learning",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000"
  },

  // Gadgets
  {
    title: "Holographic Smartphones Are Finally Here",
    description: "The highly anticipated 'Prism' phone hits the market, replacing the traditional screen with a 3D volumetric display.",
    content: "TOKYO — The era of the flat screen might be ending. Tech giant Nexa has just released the 'Prism V1', the world's first commercially viable holographic smartphone. Using a matrix of micro-lasers, the device projects a responsive 3D volumetric display three inches above the chassis. Users can interact with 3D models, maps, and even holographic video calls without needing glasses or a headset. While battery life remains a concern, early reviews praise the display's clarity even in direct sunlight.",
    categoryName: "Gadgets",
    imageUrl: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Smart Glasses That Actually Look Normal",
    description: "A startup has crammed AR technology into a standard pair of Ray-Ban-style frames, ditching the bulky sci-fi look.",
    content: "NEW YORK — Augmented Reality glasses have long been plagued by a fundamental flaw: they look ridiculous. A new startup, Clarity AR, aims to change that. Their new 'Lucid' frames weigh exactly the same as a standard pair of sunglasses and feature zero visible cameras. Using bone-conduction audio and a micro-projector hidden in the bridge, the glasses beam notifications and navigation arrows directly onto the retina. 'The goal is invisible technology,' says the CEO. 'You shouldn't have to look like a cyborg to get directions.'",
    categoryName: "Gadgets",
    imageUrl: "https://images.unsplash.com/photo-1577744486770-b21a30364e03?q=80&w=1000&auto=format&fit=crop"
  },

  // Software
  {
    title: "The Death of the IDE: Natural Language Programming",
    description: "How 'No-Code' evolved into 'Prompt-Code', allowing anyone to build complex software by simply describing it.",
    content: "SEATTLE — Writing syntax may soon become a niche skill. A new suite of development tools allows users to build entire applications using only natural language prompts. Instead of writing React components or database schemas, a user simply types 'I want a dashboard that tracks inventory and alerts me when stock is low'. The AI architect instantly generates the codebase, spins up a database, and deploys the app to the cloud. Senior developers are pivoting from writing code to 'system editing'—reviewing and tweaking the AI-generated architecture.",
    categoryName: "Software",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Operating Systems Move Entirely to the Cloud",
    description: "Major providers announce 'Thin-OS', a streaming operating system that runs entirely on remote servers.",
    content: "AUSTIN — Why buy a $2,000 laptop when a $200 terminal can do the same job? This is the premise behind 'Thin-OS', a new cloud-streaming operating system. Your local machine only handles the display and input; the actual processing, storage, and memory are handled by a server farm hundreds of miles away. As 5G and fiber networks become ubiquitous, the latency is entirely unnoticeable to the average user. This paradigm shift could drastically reduce electronic waste, as consumers won't need to upgrade their hardware every three years.",
    categoryName: "Software",
    imageUrl: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=1000&auto=format&fit=crop"
  },

  // Cybersecurity
  {
    title: "Quantum Encryption Standard Officially Ratified",
    description: "In response to the threat of quantum computing, the NIST has finalized the algorithm that will secure the future internet.",
    content: "WASHINGTON — The 'Q-Day' threat—the moment a quantum computer becomes powerful enough to crack current RSA encryption—is looming. To head off this cryptographic apocalypse, the National Institute of Standards and Technology (NIST) has officially ratified the 'Lattice-Q' algorithm as the new global standard for digital security. Major tech firms are now racing to roll out updates to browsers, banking apps, and secure messaging platforms to ensure all data is 'Quantum-Resistant' by the end of the year.",
    categoryName: "Cybersecurity",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "The Rise of Autonomous AI Hackers",
    description: "Security experts warn of 'Worm-GPT', an autonomous virus capable of rewriting its own code to evade detection.",
    content: "BERLIN — Cybersecurity has always been a game of cat and mouse, but the mice just got a lot smarter. Security researchers have identified a new type of malware dubbed 'Worm-GPT'. Unlike traditional viruses that follow a static set of instructions, Worm-GPT is an autonomous agent. When it hits a firewall, it uses an onboard language model to analyze the defense, rewrite its own payload, and try a new attack vector. Defense firms are fighting fire with fire, deploying their own AI 'Guard-Dogs' to patrol corporate networks.",
    categoryName: "Cybersecurity",
    imageUrl: "https://images.unsplash.com/photo-1614064641936-389989710e81?q=80&w=1000&auto=format&fit=crop"
  },

  // Startups
  {
    title: "Space-Mining Startup Secures Asteroid Rights",
    description: "Astra-Core has become the first private company to secure international drilling rights on a Near-Earth Object.",
    content: "HOUSTON — The multi-trillion dollar space race has officially begun. Astra-Core, a Texas-based startup, has been granted international approval to commence robotic mining operations on asteroid 16-Psyche. The asteroid is believed to contain massive deposits of rare-earth metals essential for battery production. The company plans to launch its first autonomous 'Extractor' drones next year. If successful, this could collapse the global market price for metals like cobalt and platinum, radically changing the economics of the green energy transition.",
    categoryName: "Startups",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Lab-Grown Timber: The End of Deforestation?",
    description: "A biotech startup has successfully grown a 2x4 plank of mahogany in a lab, without cutting down a single tree.",
    content: "BOSTON — BioWood Inc. has achieved what was once thought impossible: they have cultured real wood in a laboratory. By taking cells from a living tree and feeding them a proprietary nutrient gel, the startup can 'grow' perfect, knot-free planks of timber in a matter of weeks. 'It's identical to natural wood on a cellular level,' says the founder. The process allows them to grow rare hardwoods like mahogany and ebony at a fraction of the cost, potentially ending the illegal logging trade overnight.",
    categoryName: "Startups",
    imageUrl: "https://images.unsplash.com/photo-1582650058866-1c258d4ebcc2?q=80&w=1000&auto=format&fit=crop"
  },

  // Hardware
  {
    title: "Graphene Processors Hit 100GHz Clock Speeds",
    description: "Silicon is officially obsolete as the first commercial graphene chips roll off the assembly line.",
    content: "TAIPEI — Moore's Law has been given a massive extension. After decades of theoretical research, the first commercial graphene microprocessors are finally in mass production. Unlike silicon, which overheats and degrades at ultra-high frequencies, graphene conducts electricity with almost zero resistance. The new chips are clocking in at an astounding 100GHz without requiring liquid cooling. This generational leap in hardware power will pave the way for real-time physics simulations and vastly accelerated AI training.",
    categoryName: "Hardware",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Solid-State Batteries Enter Mass Production",
    description: "The long-awaited solid-state battery is finally hitting the consumer market, promising 1,000-mile EV ranges.",
    content: "SEOUL — The bottleneck of the electric revolution has finally been broken. A major battery manufacturer has begun mass-producing solid-state cells, replacing the flammable liquid electrolyte found in traditional lithium-ion batteries with a solid ceramic material. The result? A battery that charges in five minutes, has double the energy density, and cannot catch fire even if punctured. Several automakers have announced they will be equipping their 2027 luxury sedans with the new tech.",
    categoryName: "Hardware",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1000&auto=format&fit=crop"
  },

  // Cloud Computing
  {
    title: "Undersea Data Centers: Cooling the Cloud",
    description: "Tech giants are sinking server farms to the bottom of the ocean to save on massive air-conditioning costs.",
    content: "REYKJAVIK — The cloud is going underwater. Following a successful five-year pilot program, three major cloud providers have announced plans to deploy massive server farms to the ocean floor. By submerging the data centers in pressurized, nitrogen-filled pods, the companies eliminate the need for costly air-conditioning and protect the hardware from natural disasters. The cold ocean currents provide free, infinite cooling, reducing the carbon footprint of these massive compute hubs by up to 40%.",
    categoryName: "Cloud Computing",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Edge Computing Overtakes Centralized Clouds",
    description: "Why data processing is moving out of massive server farms and into local cell towers and smart routers.",
    content: "CHICAGO — For years, 'The Cloud' meant sending your data to a massive server farm in Virginia. But as devices require real-time processing—like autonomous cars and smart factory robots—that round-trip delay is unacceptable. Enter 'Edge Computing'. Processing power is now being decentralized and installed directly into 5G cell towers and street-level hardware. By processing data at the 'edge' of the network, latency is reduced to near-zero. Analysts predict that by 2028, over 60% of all enterprise data will be processed outside of traditional centralized data centers.",
    categoryName: "Cloud Computing",
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1000&auto=format&fit=crop"
  },

  // Tech Policy
  {
    title: "The EU Drafts the 'Right to Disconnect' Directive",
    description: "A new labor law aims to make it illegal for companies to penalize employees who ignore emails after hours.",
    content: "BRUSSELS — In an effort to combat the 'always-on' culture exacerbated by remote work, the European Union is drafting a sweeping 'Right to Disconnect' directive. If passed, companies with over 50 employees will be legally required to shut down their internal messaging servers between 8 PM and 7 AM, preventing the delivery of non-emergency emails. Proponents argue it is a necessary step to protect mental health in the digital age, while critics claim it harms the flexibility that global remote workers rely on.",
    categoryName: "Tech Policy",
    imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Deepfake Regulations Face Supreme Court Challenge",
    description: "A controversial law banning the unauthorized creation of AI-generated likenesses is being challenged on free speech grounds.",
    content: "WASHINGTON — Can you copyright a face? A new federal law aimed at curbing the spread of malicious deepfakes makes it a felony to generate a synthetic likeness of a person without their explicit consent. However, digital artists and satire groups are challenging the law, arguing it violates the First Amendment. The Supreme Court has agreed to hear the case, which will set a massive precedent for how digital identity and parody are handled in the age of generative AI.",
    categoryName: "Tech Policy",
    imageUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop"
  }
];

async function main() {
  console.log("Seeding more specific articles for skyblueprime.com...");
  const tenant = await prisma.tenant.findUnique({
    where: { domain: "skyblueprime.com" }
  });

  if (!tenant) {
    console.error("skyblueprime.com tenant not found!");
    process.exit(1);
  }

  const tenantId = tenant.id;
  const user = await prisma.user.findFirst({
    where: { tenantId }
  });

  if (!user) {
    console.error("No user found for skyblueprime.com tenant!");
    process.exit(1);
  }
  const userId = user.id;

  // Ensure categories exist
  const categoryMap: Record<string, string> = {};

  for (const article of newTechArticles) {
    const catName = article.categoryName;
    if (!categoryMap[catName]) {
      let cat = await prisma.category.findFirst({
        where: { tenantId, categoryName: catName }
      });
      if (!cat) {
        cat = await prisma.category.create({
          data: { tenantId, categoryName: catName }
        });
      }
      categoryMap[catName] = cat.id;
    }
  }

  console.log("Seeding new unique tech content...");
  
  for (const a of newTechArticles) {
    const categoryId = categoryMap[a.categoryName];
    
    // Check if article exists
    const existing = await prisma.contentArticle.findFirst({
      where: {
        tenantId,
        title: a.title
      }
    });
    
    if (!existing) {
       await prisma.contentArticle.create({
         data: {
           tenantId,
           usersId: userId,
           categoryId,
           title: a.title,
           content: a.content,
           imageUrl: a.imageUrl,
           status: "published",
           trendingScore: Math.floor(Math.random() * 100),
         }
       });
       console.log(`Inserted: ${a.title} in ${a.categoryName}`);
    } else {
       console.log(`Skipped existing: ${a.title}`);
    }
  }

  console.log("Finished seeding extra unique articles.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
