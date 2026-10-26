/**
 * Keyword bucketing for MediaStack wire items on the tech-news sites.
 *
 * MediaStack only hands back one generic "technology" tag (or "general" for
 * non-English), so wire rows can't be placed under a site's category blocks by
 * their own tag. Each item is instead bucketed into the site's category
 * taxonomy by keyword-matching its title/description. Best-effort: unmatched
 * items return null and keep their original label. Pure (no server imports) so
 * the client-side landing pages can use it.
 */
const EN_KEYWORDS: Array<[string, string[]]> = [
  [
    "Artificial Intelligence",
    ["artificial intelligence", " ai ", "ai-", "chatgpt", "openai", "anthropic", "gemini", "claude", "llm", "machine learning", "generative", "chatbot", "neural", "copilot", "deepseek"],
  ],
  [
    "Cybersecurity",
    ["cybersecurity", "cyber", "hacker", "hack", "breach", "malware", "ransomware", "phishing", "vulnerability", "exploit", "zero-day", "spyware", "data leak"],
  ],
  [
    "Startups",
    ["startup", "start-up", "funding round", "raises $", "series a", "series b", "venture capital", "seed round", "founder", "unicorn", "valuation"],
  ],
  [
    "Tech Policy",
    ["regulation", "antitrust", "lawsuit", "senate", "congress", "tariff", "ban ", "privacy", "gdpr", "european union", "ftc", "doj", "court", "lawmakers", "legislation", "export control"],
  ],
  [
    "Emerging Tech",
    ["quantum", "robot", "drone", "satellite", "blockchain", "crypto", "bitcoin", "virtual reality", "augmented reality", "humanoid", "autonomous", "self-driving", "space", "nasa", "spacex", "fusion"],
  ],
  [
    "Digital Culture",
    ["tiktok", "instagram", "youtube", "social media", "streaming", "netflix", "spotify", "gaming", "video game", "influencer", "meme", "twitch", "x (formerly", "creator"],
  ],
  [
    "Enterprise & Cloud Infrastructure",
    ["cloud", "data center", "aws", "azure", "server", "enterprise", "saas", "kubernetes", "infrastructure", "semiconductor", "chip", "datacenter"],
  ],
  [
    "Big Tech",
    ["apple", "google", "microsoft", "amazon", "meta ", "tesla", "nvidia", "alphabet", "samsung", "intel", "ibm", "oracle"],
  ],
  [
    "Consumer Tech",
    ["smartphone", "iphone", "android", "pixel", "galaxy", "laptop", "tablet", "smartwatch", "earbuds", "headphones", "wearable", "gadget", "review", "tv ", "camera", "console"],
  ],
  [
    "Software Development",
    ["software", "developer", "programming", "open source", "github", "api ", "framework", "javascript", "python", "rust", "app update", "sdk", "code"],
  ],
];

const ES_KEYWORDS: Array<[string, string[]]> = [
  [
    "Inteligencia Artificial",
    ["inteligencia artificial", " ia ", "chatgpt", "openai", "anthropic", "gemini", "claude", "llm", "aprendizaje automático", "machine learning", "generativa", "chatbot", "copilot", "deepseek"],
  ],
  [
    "Ciberseguridad",
    ["ciberseguridad", "ciberataque", "hacker", "hackeo", "brecha de datos", "filtración", "malware", "ransomware", "phishing", "vulnerabilidad", "exploit", "spyware", "estafa"],
  ],
  [
    "Startups",
    ["startup", "emprendedor", "ronda de financiación", "capital riesgo", "serie a", "serie b", "unicornio", "fundador", "valoración"],
  ],
  [
    "Política Tecnológica",
    ["regulación", "antimonopolio", "demanda", "senado", "congreso", "arancel", "prohibición", "privacidad", "rgpd", "unión europea", "ley", "legislación", "tribunal", "multa"],
  ],
  [
    "Tecnologías Emergentes",
    ["cuántica", "cuántico", "robot", "dron", "satélite", "blockchain", "cripto", "bitcoin", "realidad virtual", "realidad aumentada", "humanoide", "autónomo", "conducción autónoma", "espacio", "nasa", "spacex", "fusión"],
  ],
  [
    "Cultura Digital",
    ["tiktok", "instagram", "youtube", "redes sociales", "streaming", "netflix", "spotify", "videojuego", "videojuegos", "gaming", "influencer", "meme", "twitch", "creador"],
  ],
  [
    "Empresa e Infraestructura Cloud",
    ["nube", "cloud", "centro de datos", "aws", "azure", "servidor", "empresa", "saas", "kubernetes", "infraestructura", "semiconductor", "chip"],
  ],
  [
    "Grandes Tecnológicas",
    ["apple", "google", "microsoft", "amazon", "meta ", "tesla", "nvidia", "alphabet", "samsung", "intel", "ibm", "oracle"],
  ],
  [
    "Tecnología de Consumo",
    ["smartphone", "iphone", "android", "pixel", "galaxy", "portátil", "tableta", "smartwatch", "auriculares", "wearable", "gadget", "reseña", "televisor", "cámara", "consola"],
  ],
  [
    "Desarrollo de Software",
    ["software", "desarrollador", "programación", "código abierto", "open source", "github", "api ", "framework", "javascript", "python", "rust", "actualización", "sdk"],
  ],
];

const FR_KEYWORDS: Array<[string, string[]]> = [
  [
    "Artificial Intelligence",
    ["intelligence artificielle", " ia ", "chatgpt", "openai", "anthropic", "gemini", "claude", "llm", "apprentissage automatique", "machine learning", "générative", "chatbot", "copilot", "deepseek", "mistral"],
  ],
  [
    "Cybersecurity",
    ["cybersécurité", "cyberattaque", "pirate", "piratage", "hacker", "fuite de données", "faille", "malware", "rançongiciel", "ransomware", "phishing", "hameçonnage", "vulnérabilité", "espion", "arnaque"],
  ],
  [
    "Startups",
    ["startup", "start-up", "levée de fonds", "capital-risque", "série a", "série b", "licorne", "fondateur", "valorisation", "jeune pousse"],
  ],
  [
    "Tech Policy",
    ["régulation", "réglementation", "antitrust", "procès", "sénat", "parlement", "droits de douane", "interdiction", "vie privée", "rgpd", "union européenne", "loi ", "législation", "tribunal", "amende", "cnil", "arcep"],
  ],
  [
    "Emerging Tech",
    ["quantique", "robot", "drone", "satellite", "blockchain", "crypto", "bitcoin", "réalité virtuelle", "réalité augmentée", "humanoïde", "autonome", "conduite autonome", "espace", "nasa", "spacex", "fusion"],
  ],
  [
    "Digital Culture",
    ["tiktok", "instagram", "youtube", "réseaux sociaux", "streaming", "netflix", "spotify", "jeu vidéo", "jeux vidéo", "gaming", "influenceur", "mème", "twitch", "créateur", "playstation", "xbox", "nintendo", "disney+"],
  ],
  [
    "Enterprise & Cloud Infrastructure",
    ["cloud", "centre de données", "data center", "aws", "azure", "serveur", "entreprise", "saas", "kubernetes", "infrastructure", "semi-conducteur", "puce", "datacenter", "ovh"],
  ],
  [
    "Big Tech",
    ["apple", "google", "microsoft", "amazon", "meta ", "tesla", "nvidia", "alphabet", "samsung", "intel", "ibm", "oracle", "gafam"],
  ],
  [
    "Consumer Tech",
    ["smartphone", "iphone", "android", "pixel", "galaxy", "ordinateur portable", "tablette", "montre connectée", "écouteurs", "casque", "gadget", "test ", "téléviseur", "appareil photo", "console", "xiaomi", "oneplus", "oppo", "honor", "fairphone"],
  ],
  [
    "Software Development",
    ["logiciel", "développeur", "programmation", "open source", "github", "api ", "framework", "javascript", "python", "rust", "mise à jour", "sdk", "application", "code"],
  ],
];

const DE_KEYWORDS: Array<[string, string[]]> = [
  [
    "Artificial Intelligence",
    ["künstliche intelligenz", " ki ", "ki-", "chatgpt", "openai", "anthropic", "gemini", "claude", "llm", "maschinelles lernen", "generative", "chatbot", "copilot", "deepseek"],
  ],
  [
    "Cybersecurity",
    ["cybersicherheit", "cyberangriff", "hacker", "hackerangriff", "datenleck", "sicherheitslücke", "malware", "ransomware", "phishing", "schwachstelle", "spyware", "betrug", "datenklau"],
  ],
  [
    "Startups",
    ["startup", "start-up", "finanzierungsrunde", "wagniskapital", "seed", "gründer", "einhorn", "bewertung"],
  ],
  [
    "Tech Policy",
    ["regulierung", "kartell", "klage", "bundestag", "bundesrat", "zölle", "verbot", "datenschutz", "dsgvo", "europäische union", "gesetz", "gericht", "bußgeld", "bundesnetzagentur", "eu-kommission"],
  ],
  [
    "Emerging Tech",
    ["quanten", "roboter", "drohne", "satellit", "blockchain", "krypto", "bitcoin", "virtual reality", "augmented reality", "humanoid", "autonom", "autonomes fahren", "weltraum", "nasa", "spacex", "fusion"],
  ],
  [
    "Digital Culture",
    ["tiktok", "instagram", "youtube", "soziale medien", "social media", "streaming", "netflix", "spotify", "videospiel", "gaming", "influencer", "meme", "twitch", "playstation", "xbox", "nintendo"],
  ],
  [
    "Enterprise & Cloud Infrastructure",
    ["cloud", "rechenzentrum", "aws", "azure", "server", "unternehmen", "saas", "kubernetes", "infrastruktur", "halbleiter", "chip"],
  ],
  [
    "Big Tech",
    ["apple", "google", "microsoft", "amazon", "meta ", "tesla", "nvidia", "alphabet", "samsung", "intel", "ibm", "oracle"],
  ],
  [
    "Consumer Tech",
    ["smartphone", "iphone", "android", "pixel", "galaxy", "laptop", "notebook", "tablet", "smartwatch", "kopfhörer", "wearable", "gadget", "im test", "fernseher", "kamera", "konsole", "handy", "streaming-box"],
  ],
  [
    "Software Development",
    ["software", "entwickler", "programmierung", "open source", "github", "api ", "framework", "javascript", "python", "rust", "update", "sdk", "app ", "code"],
  ],
];

function bucket(table: Array<[string, string[]]>, title: string, description: string | null | undefined): string | null {
  const text = ` ${title} ${description ?? ""} `.toLowerCase();
  let best: string | null = null;
  let bestScore = 0;
  for (const [category, keywords] of table) {
    let score = 0;
    for (const kw of keywords) if (text.includes(kw)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }
  return best;
}

/** Best-matching English tech category (TECH_CATEGORIES), or null if nothing matched. */
export function classifyEnglishTechCategory(title: string, description: string | null | undefined): string | null {
  return bucket(EN_KEYWORDS, title, description);
}

/**
 * Category for a wire item on `domain`, or null to keep the item's own label.
 * techoggi.com (Italian) is left alone: it classifies in its own landing.
 */
export function classifyWireCategory(domain: string | undefined, title: string, description: string | null | undefined): string | null {
  if (!domain || domain === "techoggi.com") return null;
  if (domain === "techhoy.com") return bucket(ES_KEYWORDS, title, description);
  if (domain === "lavaguetech.com") return bucket(FR_KEYWORDS, title, description);
  if (domain === "technikpost.de") return bucket(DE_KEYWORDS, title, description);
  return bucket(EN_KEYWORDS, title, description);
}
