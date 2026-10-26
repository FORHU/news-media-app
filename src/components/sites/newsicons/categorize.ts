/**
 * MediaStack only gives newsicons.com a single "technology" feed, so it can't
 * be placed under the site's category blocks by its own tag. Like techoggi,
 * each wire item is bucketed into the NewsIcons taxonomy by keyword-matching
 * its title/description. Best-effort: unmatched items stay out of the category
 * blocks (they still appear in Latest News and the wire sections).
 */
const CATEGORY_KEYWORDS: Array<[string, string[]]> = [
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

/** Returns the best-matching newsicons.com category label, or null if nothing matched. */
export function classifyNewsIconsCategory(title: string, description: string | null | undefined): string | null {
  const text = ` ${title} ${description ?? ""} `.toLowerCase();
  let best: string | null = null;
  let bestScore = 0;
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const kw of keywords) if (text.includes(kw)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }
  return best;
}
